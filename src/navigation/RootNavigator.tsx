import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useContext } from 'react';

import AuthNavigator from '@navigation/AuthNavigator';
import TabsNavigator from '@navigation/TabsNavigator';
import ProfileScreen from '@screens/App/ProfileScreen';
import { AuthContext } from '@context/AuthContext';
import DrawerNavigator from './DrawerNavigator';

export type RootStackParamList = {
    Auth: undefined;
    App: undefined;
    Profile: undefined;
    AppDrawer: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { session } = useContext(AuthContext); // trạng thái phiên người dùng

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {session?.user ? (
                <RootStack.Group>
                    <RootStack.Screen name="App" component={TabsNavigator} />
                    <RootStack.Screen
                        name="AppDrawer"
                        component={DrawerNavigator}
                    />
                    <RootStack.Screen
                        name="Profile"
                        component={ProfileScreen}
                    />
                </RootStack.Group>
            ) : (
                <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
        </RootStack.Navigator>
    );
}
