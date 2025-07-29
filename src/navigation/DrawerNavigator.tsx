import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import TabsNavigator from '@navigation/TabsNavigator';
import ProfileScreen from '@screens/App/ProfileScreen';
import CustomDrawerContent from '@components/drawer/CustomDrawerContent';

export type DrawerParamList = {
    MainTabs: undefined;
    Profile: undefined;
    Settings: undefined;
    About: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: '#fff',
                    width: 280,
                },
                drawerActiveTintColor: '#2196F3',
                drawerInactiveTintColor: '#666',
                drawerLabelStyle: {
                    fontSize: 16,
                    fontWeight: '500',
                },
            }}
        >
            <Drawer.Screen
                name="MainTabs"
                component={TabsNavigator}
                options={{
                    drawerLabel: 'Home',
                    drawerIcon: ({ color, size }) => (
                        <FontAwesome6 name="house" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}
