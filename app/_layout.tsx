import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { AppProvider } from "../context/AppContext";

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Slot />
      </SafeAreaProvider>
    </AppProvider>
  );
}
