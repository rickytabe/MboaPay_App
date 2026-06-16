import React from "react";
import { Tabs } from "expo-router";
import CustomTabBar from "../../components/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="escrow"
        options={{
          title: "Escrow",
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
        }}
      />

      <Tabs.Screen
        name="circles"
        options={{
          title: "Circles",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}