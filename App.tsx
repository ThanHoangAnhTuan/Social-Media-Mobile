import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import RootNavigator from "@navigation/RootNavigator";
import { AuthProvider } from "@context/AuthContext";
import 'react-native-reanimated';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
