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

#import <AeroGear.h>

#pragma mark app notification constants
extern NSString * const LONewChatReceivedNotification;

@interface LOAPIClient : NSObject

@property(readwrite, copy, nonatomic) NSString *username;

// Pipes
@property(readonly, nonatomic) id <AGPipe> chatPipe;

+ (LOAPIClient *)sharedInstance;

#pragma mark - Push Subscriptions

- (void)registerToUPSServerWithToken:(NSData *)token
                             success:(void (^)(void))success
                             failure:(void (^)(NSError *error))failure;

- (void)subscribeToLiveoakPush:(void (^)(id responseObject))success
                       failure:(void (^)(NSError *error))failure;

- (void)unsubscribeFromLiveoakPush:(void (^)(id responseObject))success
                           failure:(void (^)(NSError *error))failure;

@end