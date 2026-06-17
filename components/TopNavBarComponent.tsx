import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LIGHT_COLORS, TYPOGRAPHY } from "../constants/Theme";
import { useApp } from "../context/AppContext";
import InitialsAvatar from "./InitialsAvatar";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  tabName?: string
}

export const TopNavBarComponent = ({
  title = "MboaPay",
  tabName,
  showBack = false,
  showNotifications = true,
}: TopNavProps) => {
  const router = useRouter();
  const { user, notifications, colors } = useApp();
  const styles = getStyles(colors);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push("/profile")}
          >
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <InitialsAvatar name={user.name} size={37} />
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.headerTitle} numberOfLines={1}>
          {/* {showBack ? title : (user.name ? `Hello, ${user.name.split(" ")[0]}` : title)} */}
          {tabName || title}
        </Text>
      </View>

      {showNotifications && (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
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

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
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
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.headlineMd.fontSize,
    fontWeight: "700",
    color: colors.onBackground,
    flex: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
});

export default TopNavBarComponent;
