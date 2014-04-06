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

#import "LOChatsViewController.h"
#import "LOAPIClient.h"

@implementation LOChatsViewController {
    ChatController *_chatController;
    
    NSString *_username;
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)viewDidLoad {
    [super viewDidLoad];

    // our name
    _username = [LOAPIClient sharedInstance].username;
    
    // fetch existing chat messages
    [[LOAPIClient sharedInstance].chatPipe read:^(id responseObject) {

        _chatController = [[ChatController alloc] init];
         // setup properties
        _chatController.delegate = self;
        _chatController.currentUserId = _username;
        _chatController.opponentImg = [UIImage imageNamed:@"opponentImg"];
        // initialize with existing "chat" messages
        _chatController.messagesArray = responseObject[0][@"_members"];
      
        // display it
        [self presentViewController:_chatController animated:YES completion:nil];

    } failure:^(NSError *error) {
        NSLog(@"%@", error);
    }];
    
    // register to receive notification when a message arrives
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(newMessageReceived:) name:LONewChatReceivedNotification object:nil];
}

#pragma mark - ChatController delegate

// "Send" button pressed
- (void)chatController:(ChatController *)chatController didSendMessage:(NSMutableDictionary *)message {
    // prepare message
    NSDictionary *params = @{@"name" : _username,
                             @"text" : message[kMessageContent]};

    // send it
    [[LOAPIClient sharedInstance].chatPipe save:params
                                        success:^(id responseObject) {
                                            // success!
                                        } failure:^(NSError *error) {
                                           NSLog(@"%@", error);
    }];
}

// "Logout" button pressed
- (void)rightButtonClicked:(ChatController *)chatController {
    [[LOAPIClient sharedInstance] unsubscribeFromLiveoakPush:^(id responseObject) {
        // back to login screen
        [self closeChatController:chatController];
        
    } failure:^(NSError *error) {
        NSLog(@"%@", error);
    }];
}

- (void)closeChatController:(ChatController *)chatController {
    // dismiss chats view
    [_chatController dismissViewControllerAnimated:YES completion:nil];
    // back to login
    [self.navigationController popViewControllerAnimated:YES];
}

#pragma mark - Notification handling

- (void)newMessageReceived:(NSNotification *)notification {
    NSMutableDictionary *userInfo = [[notification userInfo] mutableCopy];

    [_chatController addNewMessage:userInfo];
}

@end