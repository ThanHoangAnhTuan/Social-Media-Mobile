import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FriendsRequestScreen from '@screens/App/FriendsRequestScreen';
import FriendsScreen from '@screens/App/FriendsScreen';
import HomeScreen from '@screens/App/HomeScreen';
import NotificationsScreen from '@screens/App/NotificationsScreen';
import React from 'react';
import PersonalScreen from '../screens/App/PersonalScreen';
import ProfileScreen from '../screens/App/ProfileScreen';
import { FriendsStackParamList, TabParamList } from '../types/route';

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator();
const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
const NotificationStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const PersonalStack = createNativeStackNavigator();
const MenuStack = createNativeStackNavigator();
export const HomeStackScreen = () => {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="HomeContent" component={HomeScreen} />
        </HomeStack.Navigator>
    );
};

export const FriendsStackScreen = () => {
    return (
        <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
            <FriendsStack.Screen
                name="FriendsContent"
                component={FriendsScreen}
            />
            <FriendsStack.Screen
                name="FriendsRequest"
                component={FriendsRequestScreen}
            />
            <FriendsStack.Screen
                name="PersonalScreen"
                component={PersonalScreen}
                options={{ headerShown: false, title: 'Personal Profile' }}
            />
        </FriendsStack.Navigator>
    );
};

const ProfileStackScreen = () => {
    return (
        <MenuStack.Navigator screenOptions={{ headerShown: false }}>
            {/* <MenuStack.Screen
                name="MenuContent"
                component={MenuScreen}
                options={{ title: 'Menu' }}
            /> */}
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
