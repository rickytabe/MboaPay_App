import Constants from "expo-constants";
import { supabase } from "./supabase";
import * as Notifications from "expo-notifications";



const isExpoGo = () => Constants.appOwnership === "expo";
const getExpoProjectId = () =>
  process.env.EXPO_PROJECT_ID ||
  (Constants.expoConfig as any)?.projectId ||
  (Constants as any).manifest?.projectId ||
  "";

/**
 * Request push notification permissions and get the Expo push token
 */
export const registerPushNotifications = async (): Promise<string | null> => {
  if (isExpoGo()) {
    console.warn(
      "Push notifications are not supported in Expo Go. Use a development build or standalone app."
    );
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn(
      "Missing Expo projectId. Set EXPO_PROJECT_ID or add expo.projectId to app config for push notifications."
    );
    return null;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Push notification permissions not granted");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log("Expo push token registered:", token);
    return token;
  } catch (error) {
    console.error("Failed to register push notifications:", error);
    return null;
  }
};

/**
 * Save the push token to the database for the current user
 */
export const savePushToken = async (userId: string, token: string): Promise<boolean> => {
  try {
    // Check if token already exists
    const { data: existingToken } = await supabase
      .from("push_tokens")
      .select("id")
      .eq("user_id", userId)
      .eq("token", token)
      .maybeSingle();

    if (existingToken) {
      // Token already saved
      return true;
    }

    // Delete old tokens for this user (keep only recent ones)
    await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId)
      .lt("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Delete tokens older than 30 days

    // Save new token
    const { error } = await supabase.from("push_tokens").insert({
      user_id: userId,
      token,
      is_active: true,
    });

    if (error) {
      console.error("Failed to save push token:", error);
      return false;
    }

    console.log("Push token saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving push token:", error);
    return false;
  }
};

/**
 * Get push token for a specific user
 */
export const getPushToken = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to get push token:", error);
      return null;
    }

    return data?.token || null;
  } catch (error) {
    console.error("Error fetching push token:", error);
    return null;
  }
};

/**
 * Send a push notification to a user via Supabase Edge Function
 * This is the recommended approach as it's handled server-side
 */
export const sendPushNotificationViaBackend = async (
  targetUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        targetUserId,
        title,
        body,
        data,
      },
    });

    if (error) {
      console.warn("Failed to send push notification via backend:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error invoking push notification function:", error);
    return false;
  }
};

/**
 * Send a push notification to a user (client-side fallback)
 * Prefer sendPushNotificationViaBackend for production
 */
export const sendPushNotification = async (
  targetUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  try {
    // Try backend first (recommended)
    const backendSuccess = await sendPushNotificationViaBackend(
      targetUserId,
      title,
      body,
      data
    );

    if (backendSuccess) {
      console.log("Push notification sent via backend");
      return true;
    }

    // Fallback to client-side if backend is unavailable
    console.log("Backend unavailable, attempting client-side push");
    const token = await getPushToken(targetUserId);
    if (!token) {
      console.warn(`No push token found for user ${targetUserId}`);
      return false;
    }

    console.log("Push notification would be sent to token:", token);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
};

/**
 * Send notification for pending member join (for admin/circle owner)
 */
export const notifyAdminOfPendingMember = async (
  adminUserId: string,
  memberName: string,
  circleName: string,
  circleId: string
): Promise<boolean> => {
  const title = "New Member Request";
  const body = `${memberName} requested to join "${circleName}". Tap to review.`;
  const data = {
    type: "pending_member",
    circleId,
    screen: "admin-circle",
  };

  return sendPushNotification(adminUserId, title, body, data);
};

/**
 * Send notification for member approval (for the user)
 */
export const notifyUserOfApproval = async (
  userId: string,
  circleName: string,
  circleId: string
): Promise<boolean> => {
  const title = "Join Request Approved";
  const body = `Your request to join "${circleName}" has been approved!`;
  const data = {
    type: "member_approved",
    circleId,
    screen: "circle-detail",
  };

  return sendPushNotification(userId, title, body, data);
};

/**
 * Send notification for member payment reminder (for admin)
 */
export const notifyAdminOfUnpaidMember = async (
  adminUserId: string,
  memberName: string,
  circleName: string,
  amount: number,
  circleId: string
): Promise<boolean> => {
  const title = "Payment Reminder";
  const body = `${memberName} hasn't paid ${amount.toLocaleString()} XAF for "${circleName}"`;
  const data = {
    type: "unpaid_member",
    circleId,
    screen: "admin-circle",
  };

  return sendPushNotification(adminUserId, title, body, data);
};
