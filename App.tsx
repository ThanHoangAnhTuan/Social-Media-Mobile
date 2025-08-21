import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider } from '@context/AuthContext';
import { NotificationProvider } from '@context/NotificationContext';
import RootNavigator from '@navigation/RootNavigator';

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <NotificationProvider>
                    <NavigationContainer>
                        <RootNavigator />
                    </NavigationContainer>
                </NotificationProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
