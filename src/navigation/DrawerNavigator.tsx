import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TabsNavigator from './TabsNavigator';
import MenuScreen from '@screens/App/MenuScreen';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
    return (
        <Drawer.Navigator
            initialRouteName="MainTabs"
            screenOptions={{ headerShown: false }}
        >
            <Drawer.Screen
                name="MainTabs"
                component={TabsNavigator}
                options={{ title: 'Trang chủ' }}
            />
            <Drawer.Screen
                name="Menu"
                component={MenuScreen}
                options={{ title: 'Menu' }}
            />
        </Drawer.Navigator>
    );
}
