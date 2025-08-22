import { FriendRequest } from "./friend";

export type DrawerParamList = {
    Home: undefined;
    EditProfile: undefined;
};

export type RootStackParamList = {
    Auth: undefined;
    EditProfile: undefined;
    AppTabs: undefined;
    AppDrawer: undefined;
    Test: undefined;
    Personal: { userId?: string };
    PostDetail: { 
        postId: string; 
        fromNotification?: boolean;
    };
};

export type HomeStackParamList = {
    HomeContent: {
        scrollToPost?: string;
        fromNotification?: boolean;
    } | undefined;
};

export type TabParamList = {
    Home: { 
        screen?: string;
        params?: {
            scrollToPost?: string;
            fromNotification?: boolean;
        };
    } | undefined;
    Friends: { 
        screen?: string;
        params?: {
            fromNotification?: boolean;
        };
    } | undefined;
    Notifications: undefined;
    Menu: undefined;
    PersonalScreen: { userId: string };
};

export type ProfileStackParamList = {
    ProfileContent: {userId: string};
    Personal: { userId?: string };
};

export type FriendsStackParamList = {
    FriendsContent: { userId: string };
    FriendsRequest: { 
        currentUserId: string; 
        friendRequests: FriendRequest[];
        fromNotification?: boolean;
    };
    PersonalContent: { userId: string };
};


