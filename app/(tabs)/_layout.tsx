import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/Theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.outlineVariant,
          height: 84,
          paddingBottom: 20,
          paddingTop: 10,
          backgroundColor: COLORS.surface,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarActiveTintColor: COLORS.primaryContainer,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="circles"
        options={{
          title: "Circles",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="escrow"
        options={{
          title: "Escrow",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "shield-checkmark" : "shield-checkmark-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}