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
};

export type TabParamList = {
    Home: undefined;
    Friends: undefined;
    Notifications: undefined;
    Profile: undefined;
    PersonalScreen: { userId: string };
};

export type ProfileStackParamList = {
    ProfileContent: {userId: string};
    Personal: { userId?: string };
};

export type FriendsStackParamList = {
    FriendsContent: { userId: string };
    FriendsRequest: { currentUserId: string; friendRequests: FriendRequest[] };
    PersonalContent: { userId: string };
};


