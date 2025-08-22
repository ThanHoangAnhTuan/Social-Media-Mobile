import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import TabsNavigator from '@navigation/TabsNavigator';
import CustomDrawerContent from '@components/drawer/CustomDrawerContent';
import { DrawerParamList } from '../types/route';
import EditProfileScreen from '../screens/App/EditProfileScreen';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerTitle: 'My App',
                headerTitleStyle: {
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 'bold',
                },
                headerStyle: {
                    backgroundColor: '#6366f1',
                },
                drawerStyle: {
                    backgroundColor: '#fff',
                    width: 280,
                },
                drawerActiveTintColor: '#6366f1',
                drawerInactiveTintColor: '#666',
                drawerLabelStyle: {
                    fontSize: 16,
                    fontWeight: '500',
                },
            }}
        >
            <Drawer.Screen
                name="Home"
                component={TabsNavigator}
                // options={({ route }) => ({
                //     drawerIcon: ({ color, size }) => (
                //         <FontAwesome6 name="house" size={size} color={color} />
                //     ),
                // })}

                options={({ route }) => {
                    console.log(route);
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home'; 
                    console.log(routeName);
                    
                    return {
                        headerShown: routeName !== 'Menu',
                        drawerIcon: ({ color, size }) => (
                            <FontAwesome6 name="house" size={size} color={color} />
                        ),
                    };
                }}
            />
        </Drawer.Navigator>
    );
}
