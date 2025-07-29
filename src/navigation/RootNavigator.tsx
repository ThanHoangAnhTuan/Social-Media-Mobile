import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useContext } from 'react';

import { AuthContext } from '@context/AuthContext';
import DrawerNavigator from '@navigation/DrawerNavigator';
import EditProfileScreen from '@screens/App/EditProfileScreen';
import AuthNavigator from '@navigation/AuthNavigator';
import { RootStackParamList } from '../types/route';
import PostManagementScreen from '../screens/App/PostManagementScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { session } = useContext(AuthContext);
    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {session?.user ? (
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
                        name="Test"
                        component={PostManagementScreen}
                    />
                </RootStack.Group>
            ) : (
                <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
        </RootStack.Navigator>
    );
}
