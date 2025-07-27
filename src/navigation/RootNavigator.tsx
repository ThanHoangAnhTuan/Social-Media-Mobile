import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useContext } from 'react';

import { AuthContext } from '@context/AuthContext';
import DrawerNavigator from '@navigation/DrawerNavigator';

export type RootStackParamList = {
    Auth: undefined;
    AppDrawer: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { session } = useContext(AuthContext);

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="AppDrawer" component={DrawerNavigator} />
            {/* {session?.user ? (
                <RootStack.Group>
                    <RootStack.Screen name="App" component={TabsNavigator} />
                    <RootStack.Screen
                        name="Profile"
                        component={ProfileScreen}
                    />
                </RootStack.Group>
            ) : (
                <RootStack.Screen name="Auth" component={AuthNavigator} />
            )} */}
        </RootStack.Navigator>
    );
}
