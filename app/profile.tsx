import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import InitialsAvatar from "../components/InitialsAvatar";
import { LIGHT_COLORS, ROUNDED, SPACING } from "../constants/Theme";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";

const ProfileMenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
  iconColor,
  iconBgColor,
  showChevron = true,
  styles,
  colors,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  iconColor?: string;
  iconBgColor?: string;
  showChevron?: boolean;
  styles: any;
  colors: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const finalIconColor = iconColor || colors.primary;
  const finalIconBgColor = iconBgColor || colors.surfaceContainer;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.menuItem}
      >
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIconContainer, { backgroundColor: finalIconBgColor }]}>
            <Ionicons name={icon} size={20} color={finalIconColor} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {showChevron && (
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Profile() {
  const router = useRouter();
  const { user, logout, selectedOperator, updateAvatar, theme, colors, toggleTheme } = useApp();
  const toast = useToast();
  const styles = getStyles(colors);

  const performLogout = async () => {
    try {
      await logout();
      toast.success("Logged out", "Your session has been closed.");
      router.replace("/login");
    } catch (err) {
      const message = getErrorMessage(err, "Could not log out. Please try again.");
      toast.error("Log out failed", message);
    }
  };

  const handleLogout = () => {
    Alert.alert("Confirm Log Out", "Are you sure you want to log out of your MboaPay account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          void performLogout();
        },
      },
    ]);
  };

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        toast.error("Permission denied", "Allow gallery access to update your profile photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        await updateAvatar(uri);
        toast.success("Profile updated", "Your picture has been uploaded successfully.");
      }
    } catch (err) {
      const message = getErrorMessage(err, "Could not update avatar. Please try again.");
      toast.error("Avatar update failed", message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Premium Hero Gradient Header */}
      <LinearGradient
        colors={[colors.primaryContainer, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBackground}
      >
        <SafeAreaView edges={["top"]} style={styles.heroSafeArea}>
          <Text style={styles.heroTitle}>My Profile</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overlapping Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.8}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <InitialsAvatar name={user.name} size={110} />
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user.name || "MboaPay User"}</Text>
          <View style={styles.userMetricsRow}>
            <View style={styles.metricBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={styles.metricIcon} />
              <Text style={styles.metricText}>Verified Account</Text>
            </View>
          </View>
        </View>

        {/* Section: Account */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Account Settings</Text>
          <View style={styles.menuCard}>
            <ProfileMenuItem
              icon="call"
              title="Phone Number"
              subtitle={user.phone || "-"}
              showChevron={false}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon="mail"
              title="Email Address"
              subtitle={user.email || "Add email to secure account"}
              styles={styles}
              colors={colors}
            />
          </View>
        </View>

        {/* Section: Preferences */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.menuCard}>
            <ProfileMenuItem
              icon="wallet"
              title="Connected Wallet"
              subtitle={selectedOperator === "MTN" ? "MTN Mobile Money" : "Orange Money"}
              iconColor={selectedOperator === "MTN" ? "#b38f00" : colors.orange}
              iconBgColor={selectedOperator === "MTN" ? "#FFF8CC" : "#FFE5D9"}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon="notifications"
              title="Notifications"
              subtitle="Push and Email"
              iconColor="#8e44ad"
              iconBgColor="#f4e5ff"
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme === "dark" ? "#1e293b" : "#e2e8f0" }]}>
                  <Ionicons name="moon-outline" size={20} color={theme === "dark" ? "#60a5fa" : "#475569"} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Dark Mode</Text>
                </View>
              </View>
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: "#d1d5db", true: colors.primaryContainer }}
                thumbColor={theme === "dark" ? colors.secondary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* Section: Security */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Security</Text>
          <View style={styles.menuCard}>
            <ProfileMenuItem
              icon="finger-print"
              title="Biometric Login"
              subtitle="Enabled"
              iconColor={colors.secondary}
              iconBgColor={theme === "dark" ? "rgba(82, 219, 154, 0.1)" : colors.secondaryContainer}
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon="lock-closed"
              title="Change PIN"
              iconColor="#e67e22"
              iconBgColor="#fdebd0"
              styles={styles}
              colors={colors}
            />
          </View>
        </View>

        {/* Section: Support */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Support & Legal</Text>
          <View style={styles.menuCard}>
            <ProfileMenuItem
              icon="help-buoy"
              title="Help Center"
              iconColor="#16a085"
              iconBgColor="#d1f2eb"
              styles={styles}
              colors={colors}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon="document-text"
              title="Terms of Service"
              iconColor={colors.onSurfaceVariant}
              iconBgColor={colors.surfaceContainer}
              styles={styles}
              colors={colors}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>MboaPay v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroBackground: {
    height: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  heroSafeArea: {
    alignItems: "center",
    paddingTop: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 110,
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 16,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 4,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onBackground,
    marginBottom: 6,
  },
  userMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ROUNDED.full,
    borderWidth: 1,
    borderColor: colors.primary + "22",
  },
  metricIcon: {
    marginRight: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: ROUNDED.xl,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuTextContainer: {
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onSurface,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginLeft: 70,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error + "15",
    paddingVertical: 16,
    borderRadius: ROUNDED.lg,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    color: colors.outline,
    fontSize: 12,
    fontWeight: "500",
  },
});
