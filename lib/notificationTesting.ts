import { supabase } from "../supabase";

/**
 * Testing utilities for push notifications
 * Use these functions in development to test push notification flows
 */

/**
 * Send a test push notification to yourself
 * @param userId - Your user ID
 * @param title - Notification title
 * @param body - Notification body
 * @returns true if successful
 */
export const sendTestPushNotification = async (
  userId: string,
  title: string = "Test Notification",
  body: string = "This is a test push notification from MboaPay"
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        targetUserId: userId,
        title,
        body,
        data: {
          type: "test",
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error("Failed to send test notification:", error);
      return false;
    }

    console.log("Test notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending test notification:", error);
    return false;
  }
};

/**
 * Check if a user has push tokens registered
 * @param userId - User ID to check
 * @returns Array of push tokens
 */
export const checkUserPushTokens = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("push_tokens")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to check push tokens:", error);
      return [];
    }

    console.log(`Found ${data?.length || 0} push tokens for user ${userId}`, data);
    return data || [];
  } catch (error) {
    console.error("Error checking push tokens:", error);
    return [];
  }
};

/**
 * Cleanup old push tokens (older than specified days)
 * @param userId - User ID to clean up
 * @param olderThanDays - Delete tokens older than this many days
 * @returns Number of tokens deleted
 */
export const cleanupOldPushTokens = async (
  userId: string,
  olderThanDays: number = 30
): Promise<number> => {
  try {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: toDelete, error: fetchError } = await supabase
      .from("push_tokens")
      .select("id")
      .eq("user_id", userId)
      .lt("created_at", cutoffDate);

    if (fetchError) {
      console.error("Failed to fetch old tokens:", fetchError);
      return 0;
    }

    if (!toDelete || toDelete.length === 0) {
      console.log("No old tokens to delete");
      return 0;
    }

    const { error: deleteError } = await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId)
      .lt("created_at", cutoffDate);

    if (deleteError) {
      console.error("Failed to delete old tokens:", deleteError);
      return 0;
    }

    console.log(`Deleted ${toDelete.length} old push tokens`);
    return toDelete.length;
  } catch (error) {
    console.error("Error cleaning up push tokens:", error);
    return 0;
  }
};

/**
 * Simulate a pending member notification
 * Useful for testing the admin notification flow
 * @param adminUserId - Admin to notify
 * @param memberName - Name of the member joining
 * @param circleName - Name of the circle
 * @param circleId - ID of the circle
 * @returns true if successful
 */
export const simulatePendingMemberNotification = async (
  adminUserId: string,
  memberName: string = "Test Member",
  circleName: string = "Test Circle",
  circleId: string = "test-circle-id"
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        targetUserId: adminUserId,
        title: "New Member Request",
        body: `${memberName} requested to join "${circleName}". Tap to review.`,
        data: {
          type: "pending_member",
          circleId,
          screen: "admin-circle",
        },
      },
    });

    if (error) {
      console.error("Failed to simulate pending member notification:", error);
      return false;
    }

    console.log("Pending member notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error simulating notification:", error);
    return false;
  }
};

/**
 * Simulate a member approval notification
 * Useful for testing the user notification flow
 * @param userId - User to notify
 * @param circleName - Name of the circle
 * @param circleId - ID of the circle
 * @returns true if successful
 */
export const simulateApprovalNotification = async (
  userId: string,
  circleName: string = "Test Circle",
  circleId: string = "test-circle-id"
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        targetUserId: userId,
        title: "Join Request Approved",
        body: `Your request to join "${circleName}" has been approved!`,
        data: {
          type: "member_approved",
          circleId,
          screen: "circle-detail",
        },
      },
    });

    if (error) {
      console.error("Failed to simulate approval notification:", error);
      return false;
    }

    console.log("Approval notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error simulating approval notification:", error);
    return false;
  }
};

/**
 * Check all push tokens across the system (admin only)
 * This queries all tokens - be careful with this!
 * @returns Count and sample of tokens
 */
export const getSystemPushTokensStats = async (): Promise<{
  totalTokens: number;
  activeTokens: number;
  inactiveTokens: number;
  totalUsers: number;
} | null> => {
  try {
    const { data, error } = await supabase
      .from("push_tokens")
      .select("is_active, user_id", { count: "exact" });

    if (error) {
      console.error("Failed to get push token stats:", error);
      return null;
    }

    const stats = {
      totalTokens: data?.length || 0,
      activeTokens: data?.filter((t: any) => t.is_active).length || 0,
      inactiveTokens: data?.filter((t: any) => !t.is_active).length || 0,
      totalUsers: new Set(data?.map((t: any) => t.user_id)).size || 0,
    };

    console.log("Push token statistics:", stats);
    return stats;
  } catch (error) {
    console.error("Error getting push token stats:", error);
    return null;
  }
};
