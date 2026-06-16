// Follow this setup guide to integrate the Deno template into your project:
// https://deno.land/manual@v1.40.0/getting_started/setup_your_environment
// This reply should be removed once the integration is done.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PushNotificationPayload {
  to: string; // Expo push token
  sound: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { targetUserId, title, body, data } = await req.json();

    if (!targetUserId || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the push token for the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tokenData, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", targetUserId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error("Error fetching push token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!tokenData || !tokenData.token) {
      console.log("No push token found for user:", targetUserId);
      return new Response(
        JSON.stringify({ success: true, message: "No token found, skipping" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send push notification via Expo
    const payload: PushNotificationPayload = {
      to: tokenData.token,
      sound: "default",
      title,
      body,
      data: data || {},
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Expo API error:", responseData);
      return new Response(
        JSON.stringify({ error: "Failed to send push notification", details: responseData }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Push notification sent successfully:", responseData);
    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
