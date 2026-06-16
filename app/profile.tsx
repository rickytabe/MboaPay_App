import React from "react";
import { StyleSheet, Text, View, Image, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import TopNavBarComponent from "../components/TopNavBarComponent";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";

export default function Profile() {
  const router = useRouter();
  const { user, logout, selectedOperator } = useApp();
  const toast = useToast();

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
    Alert.alert(
      "Confirm Log Out",
      "Are you sure you want to log out of your MboaPay account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent title="My Profile" />

      {/* Profile Header Hero */}
      <View style={styles.heroSection}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: user.avatarUrl || "https://i.pravatar.cc/150" }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.nameText}>{user.name || "MboaPay User"}</Text>
        <Text style={styles.phoneText}>{user.phone || "No phone linked"}</Text>
      </View>

      {/* Account Info Details */}
      <Text style={styles.sectionTitle}>Account Details</Text>
      <Card variant="elevated" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Phone Number</Text>
          </View>
          <Text style={styles.infoValue}>{user.phone || "-"}</Text>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Email Address</Text>
          </View>
          <Text style={styles.infoValue}>{user.email || "Not provided"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Connected Wallet</Text>
          </View>
          <Text style={[styles.infoValue, selectedOperator === "MTN" ? { color: "#b38f00" } : { color: COLORS.orange }]}>
            {selectedOperator === "MTN" ? "MTN MoMo" : "Orange Money"}
          </Text>
        </View>
      </Card>

      {/* Security Details */}
      <Text style={styles.sectionTitle}>Security & Legal</Text>
      <Card variant="outlined" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.infoLabel}>Biometric Login</Text>
          </View>
          <Text style={styles.infoValueDisabled}>Enabled</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.onSurfaceVariant} />
            <Text style={styles.infoLabel}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.outline} />
        </View>
      </Card>

      <View style={styles.bottomSection}>
        <Button
          title="Log Out"
          onPress={handleLogout}
          type="outlined"
          style={styles.logoutBtn}
          textStyle={{ color: COLORS.error }}
        />
        <Text style={styles.versionText}>MboaPay v1.0.0 (Expo 54)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 50,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: COLORS.primaryContainer,
    marginBottom: 16,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 10,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  infoValueDisabled: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  bottomSection: {
    marginTop: 20,
    alignItems: "center",
    gap: 16,
  },
  logoutBtn: {
    borderColor: COLORS.error,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
});
