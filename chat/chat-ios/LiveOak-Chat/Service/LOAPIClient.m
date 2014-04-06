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

#import <AeroGearPush.h>

#import "LOAPIClient.h"

// -----------------------------------------------------------
#pragma mark - UPS Settings
static NSString *const kUPSHost = @"<# INSERT UPS URL HERE #>";  // e.g "http://myhost:myport/unifiedpush-server-0.10.1"
static NSString *const kVariantId = @"<# INSERT VARIANT ID HERE #>";
static NSString *const kSVariantSecret = @"<# INSERT VARIANT SECRET HERE #>";

#pragma mark - LiveOak Application Settings
static NSString *const kLiveOakChatAPIBaseURLString = @"<# INSERT LIVEOAK APPLICATION URL #>"; // e.g. "http://myhost:myport/chat-html";
// -----------------------------------------------------------


@implementation LOAPIClient {
    NSString *_applicationName;
    NSString *_alias;

    id <AGPipe> _liveoakPushPipe;
}

#pragma mark - LiveOak Push subscription Settings
static NSString *const kUPSResourceName = @"push";
static NSString *const kResourceSubscription = @"/storage/chat/*";

#pragma mark - pricate app constants
static NSString *const kPrefAlias = @"alias";
static NSString *const kPrefUsername = @"username";

#pragma mark app notification constants
NSString *const LONewChatReceivedNotification = @"LONewChatReceivedNotification";

@synthesize username = _username;

+ (LOAPIClient *)sharedInstance {
    static LOAPIClient *_sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _sharedInstance = [[self alloc] init];
    });

    return _sharedInstance;
}

- (instancetype)init {
    if (self = [super init]) {

        NSURL *baseURL = [NSURL URLWithString:kLiveOakChatAPIBaseURLString];
        
        // determine application name from url
        _applicationName = [baseURL lastPathComponent];

        // create our Pipeline
        AGPipeline *pipeline = [AGPipeline pipelineWithBaseURL:baseURL];

        // set up application pipes
        _chatPipe = [pipeline pipe:^(id <AGPipeConfig> config) {
            [config setName:@"/storage/chat"];

            [config setPageConfig:^(id<AGPageConfig> pageConfig) {
                [pageConfig setParameterProvider:@{@"expand" : @"members", @"limit" : @100}];
            }];
        }];

        _liveoakPushPipe = [pipeline pipe:^(id <AGPipeConfig> config) {
            [config setName:@"/push/subscriptions"];
        }];
        
        // extract "alias"
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        _alias = [defaults stringForKey:kPrefAlias];
        
        // if it doesn't exist, create one
        if (!_alias) {
            _alias = [[NSUUID UUID] UUIDString];
            [defaults setObject:_alias forKey:kPrefAlias];
            [defaults synchronize];
        }
    }

    return (self);
}

#pragma mark - LiveOak Push subscription

- (void)subscribeToLiveoakPush:(void (^)(id responseObject))success
                       failure:(void (^)(NSError *error))failure {

    NSDictionary *params = @{@"resourcePath" : [NSString stringWithFormat:@"%@/%@", _applicationName, kResourceSubscription],
                             @"alias" : @[_alias],
                             @"id" : _alias,
                             @"message" : @{@"content-available" : @YES, @"alert" : @"New message", @"title" : @"LiveOak Chat", @"sound" : @"default"}};


    // subscribe to push endpoint
    [_liveoakPushPipe save:params success:success failure:failure];
}

- (void)unsubscribeFromLiveoakPush:(void (^)(id responseObject))success
                           failure:(void (^)(NSError *error))failure {
    
    NSDictionary *params = @{@"id" : _alias};
    
    // unsubscribe from push endpoint
    [_liveoakPushPipe remove:params success:success failure:failure];
}

#pragma mark - UPS registration

- (void)registerToUPSServerWithToken:(NSData *)token
                             success:(void (^)(void))success
                             failure:(void (^)(NSError *error))failure {

    AGDeviceRegistration *registration =
            [[AGDeviceRegistration alloc] initWithServerURL:[NSURL URLWithString:kUPSHost]];

    // perform registration of this device
    [registration registerWithClientInfo:^(id <AGClientDeviceInformation> clientInfo) {
        // set up configuration parameters

        // apply the deviceToken as received by Apple's Push Notification service
        [clientInfo setDeviceToken:token];

        [clientInfo setVariantID:kVariantId];
        [clientInfo setVariantSecret:kSVariantSecret];

        UIDevice *currentDevice = [UIDevice currentDevice];

        [clientInfo setOperatingSystem:[currentDevice systemName]];
        [clientInfo setOsVersion:[currentDevice systemVersion]];
        [clientInfo setDeviceType:[currentDevice model]];

        [clientInfo setAlias:_alias];

    } success:^() {
        if (success)
            success();

    } failure:^(NSError *error) {
        if (failure)
            failure(error);
    }];
}

#pragma mark - username property override to write on system defaults
- (NSString *)username {
    if (!_username) {
        // attempt to load from disk
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        _username = [defaults stringForKey:kPrefUsername];
        // if it doesn't exist
        if (_username == nil)
            _username = @"";
    }
    
    return [_username copy];
}

- (void)setUsername:(NSString *)username {
    _username = username;

    // save it
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setObject:username forKey:kPrefUsername];
    [defaults synchronize];
}

@end