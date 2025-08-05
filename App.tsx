import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import Header from "./src/components/app/Header";

import RootNavigator from '@navigation/RootNavigator';
import { AuthProvider } from '@context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
