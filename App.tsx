import { NavigationContainer } from "@react-navigation/native";
import React from "react";

import RootNavigator from "@navigation/RootNavigator";
import { AuthProvider } from "@context/AuthContext";
import 'react-native-reanimated';
import Header from "./src/components/app/Header";

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
