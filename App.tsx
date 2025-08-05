import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import RootNavigator from '@navigation/RootNavigator';
import { AuthProvider } from '@context/AuthContext';

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
