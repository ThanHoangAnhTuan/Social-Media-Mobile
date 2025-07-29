import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import FriendsScreen from '@screens/App/FriendsScreen';
import HomeScreen from '@screens/App/HomeScreen';
import NotificationsScreen from '@screens/App/NotificationsScreen';
import ProfileScreen from '../screens/App/ProfileScreen';


export type TabParamList = {
    Home: undefined;
    Friends: undefined;
    Notifications: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator();
const FriendsStack = createNativeStackNavigator();
const NotificationStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const HomeStackScreen = () => {
    return (
        <HomeStack.Navigator>
            <HomeStack.Screen
                name="HomeContent"
                component={HomeScreen}
                options={{ title: 'Home' }}
            />
        </HomeStack.Navigator>
    );
};

const FriendsStackScreen = () => {
    return (
        <FriendsStack.Navigator>
            <FriendsStack.Screen
                name="FriendsContent"
                component={FriendsScreen}
                options={{
                    title: 'Friends',
                }}
            />
        </FriendsStack.Navigator>
    );
};

const ProfileStackScreen = () => {
    return (
        <ProfileStack.Navigator>
            <ProfileStack.Screen
                name="ProfileContent"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </ProfileStack.Navigator>
    );
};

const NotificationStackScreen = () => {
    return (
        <NotificationStack.Navigator>
            <NotificationStack.Screen
                name="NotificationContent"
                component={NotificationsScreen}
                options={{ title: 'Notifications' }}
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
                        <FontAwesome6 name="house" size={24} color={color} />
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
                            color={color}
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
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStackScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="person" size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
