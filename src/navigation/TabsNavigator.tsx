import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import FriendsScreen from '@screens/App/FriendsScreen';
import HomeScreen from '@screens/App/HomeScreen';
import MenuScreen from '@screens/App/MenuScreen';
import NotificationsScreen from '@screens/App/NotificationsScreen';
import ProfileScreen from '../screens/App/ProfileScreen';

export type TabParamList = {
    Home: undefined;
    Friends: undefined;
    Notifications: undefined;
    Menu: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator();
const FriendsStack = createNativeStackNavigator();
const MenuStack = createNativeStackNavigator();
const NotificationStack = createNativeStackNavigator();

const HomeStackScreen = () => {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="HomeContent" component={HomeScreen} />
        </HomeStack.Navigator>
    );
};

const FriendsStackScreen = () => {
    return (
        <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
            <FriendsStack.Screen
                name="FriendsContent"
                component={FriendsScreen}
                options={{ title: 'Bạn bè' }}
            />
        </FriendsStack.Navigator>
    );
};

const MenuStackScreen = () => {
    return (
        <MenuStack.Navigator screenOptions={{ headerShown: false }}>
            <MenuStack.Screen
                name="MenuContent"
                component={MenuScreen}
                options={{ title: 'Menu' }}
            />
            <MenuStack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Trang cá nhân' }}
            />
        </MenuStack.Navigator>
    );
};

const NotificationStackScreen = () => {
    return (
        <NotificationStack.Navigator screenOptions={{ headerShown: false }}>
            <NotificationStack.Screen
                name="NotificationContent"
                component={NotificationsScreen}
                options={{ title: 'Thông báo' }}
            />
        </NotificationStack.Navigator>
    );
};

export default function TabsNavigator() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen
                name="Home"
                component={HomeStackScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <FontAwesome6 name="house" size={24} color="black" />
                    ),
                }}
            />
            <Tab.Screen
                name="Friends"
                component={FriendsStackScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons
                            name="people-alt"
                            size={24}
                            color="black"
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationStackScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons
                            name="notifications"
                            size={24}
                            color="black"
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Menu"
                component={MenuStackScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="menu" size={24} color="black" />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
