/*
 * JBoss, Home of Professional Open Source.
 * Copyright Red Hat, Inc., and individual contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "LOAppDelegate.h"

#import "LOAPIClient.h"

@implementation LOAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    // Let the device know we want to receive push notifications
    [[UIApplication sharedApplication] registerForRemoteNotificationTypes:
     (UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert)];

    return YES;
}

#pragma mark - Push Notification handling

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    // register with UPS server
    [[LOAPIClient sharedInstance] registerToUPSServerWithToken:deviceToken success:^{
        // success
    } failure:^(NSError *error) {
        NSLog(@"%@", error);
    }];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
    NSLog(@"APNs Error: %@", error);
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
        fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {

    // upon user tapping the notification, iOS will call "again"
    // this method so the app knows which notification was tapped.
    // Since we have already handled the notification (in background or foreground)
    // there is no need to retrieve it again if the state is UIApplicationStateInactive
    if (application.applicationState ==  UIApplicationStateInactive)
        return;

    // the event type
    NSString *event = userInfo[@"io.liveoak.push.event"];

    if ([event isEqualToString:@"created"]) {
        // extract the new resource id
        NSString *resourceURI = [[userInfo[@"io.liveoak.push.url"] componentsSeparatedByString:@"/"] lastObject];

        // fetch it
        [[LOAPIClient sharedInstance].chatPipe read:resourceURI success:^(id responseObject) {
            // post a notif to let interested listeners to process
            [[NSNotificationCenter defaultCenter] postNotificationName:LONewChatReceivedNotification object:nil userInfo:responseObject];
            // let the system know we have finished processing
            completionHandler(UIBackgroundFetchResultNewData);

        } failure:^(NSError *error) {
            NSLog(@"%@", error);

            // let the system know we have finished processing
            completionHandler(UIBackgroundFetchResultFailed);
        }];
    }
}

@end
