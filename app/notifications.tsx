import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp, AppNotification } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import TopNavBarComponent from "../components/TopNavBarComponent";
import Card from "../components/Card";

export default function Notifications() {
  const router = useRouter();
  const { notifications, markAllNotificationsAsRead, clearNotifications } = useApp();

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return { name: "arrow-down-circle-outline" as const, color: COLORS.secondary };
      case "withdrawal":
        return { name: "arrow-up-circle-outline" as const, color: COLORS.onSurfaceVariant };
      case "tontine_due":
        return { name: "alert-circle-outline" as const, color: COLORS.error };
      case "tontine_payout":
        return { name: "gift-outline" as const, color: COLORS.secondary };
      case "escrow_lock":
        return { name: "lock-closed-outline" as const, color: COLORS.primary };
      case "escrow_release":
        return { name: "lock-open-outline" as const, color: COLORS.secondary };
      default:
        return { name: "notifications-outline" as const, color: COLORS.primary };
    }
  };

  const renderNotificationCard = (item: AppNotification) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <View key={item.id} style={[styles.notificationRow, !item.read && styles.unreadRow]}>
        <View style={[styles.iconContainer, { backgroundColor: icon.color + "15" }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.contentSection}>
          <View style={styles.rowHeader}>
            <Text style={styles.titleText}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.bodyText}>{item.message}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>
    );
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TopNavBarComponent showBack title="Notifications" />

      <View style={styles.actionHeader}>
        <Text style={styles.subtext}>Stay updated on savings cycles and deals</Text>
        {notifications.length > 0 && (
          <View style={styles.actions}>
            {hasUnread && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.actionLink}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearNotifications}>
              <Text style={[styles.actionLink, { color: COLORS.error }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Card variant="outlined" style={styles.listCard} noPadding>
        {notifications.length > 0 ? (
          notifications.map((item, idx) => (
            <View key={item.id}>
              {renderNotificationCard(item)}
              {idx < notifications.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.outline} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You have no new notifications at the moment.</Text>
          </View>
        )}
      </Card>
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
    paddingBottom: 30,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionLink: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryContainer,
  },
  listCard: {
    backgroundColor: COLORS.surface,
  },
  notificationRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  unreadRow: {
    backgroundColor: COLORS.primaryContainer + "06",
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: ROUNDED.md,
    justifyContent: "center",
    alignItems: "center",
  },
  contentSection: {
    flex: 1,
    gap: 4,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  bodyText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 16,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  emptyContainer: {
    padding: 50,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18,
  },
});
export default Notifications;
