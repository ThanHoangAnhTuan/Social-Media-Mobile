import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AuthNavigator from '@navigation/AuthNavigator';
import DrawerNavigator from '@navigation/DrawerNavigator';
import EditProfileScreen from '@screens/App/EditProfileScreen';
import PostDetailScreen from '@screens/App/PostDetailScreen';
import PersonalScreen from '../screens/App/PersonalScreen';
import { RootStackParamList } from '../types/route';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const user = useSelector((state: RootState) => state.session.user);
    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <RootStack.Group>
                    <RootStack.Screen
                        name="AppDrawer"
                        component={DrawerNavigator}
                    />
                    <RootStack.Screen
                        name="EditProfile"
                        component={EditProfileScreen}
                    />
                    <RootStack.Screen
                        name="Personal"
                        component={PersonalScreen}
                    />
                    <RootStack.Screen
                        name="PostDetail"
                        component={PostDetailScreen}
                    />
                </RootStack.Group>
            ) : (
                <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
        </RootStack.Navigator>
    );
}
