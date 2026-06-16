import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY } from "../constants/Theme";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
}

export const TopNavBarComponent = ({
  title = "MboaPay",
  showBack = false,
  showNotifications = true,
}: TopNavProps) => {
  const router = useRouter();
  const { user, notifications } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push("/profile")}
          >
            <Image
              source={{ uri: user.avatarUrl || "https://i.pravatar.cc/150" }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        )}

        <Text style={styles.headerTitle} numberOfLines={1}>
          {showBack ? title : (user.name ? `Hello, ${user.name.split(" ")[0]}` : title)}
        </Text>
      </View>

      {showNotifications && (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "transparent",
    paddingBottom: 8,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.primaryContainer,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.headlineMd.fontSize,
    fontWeight: "700",
    color: COLORS.primary,
    flex: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
});

export default TopNavBarComponent;
