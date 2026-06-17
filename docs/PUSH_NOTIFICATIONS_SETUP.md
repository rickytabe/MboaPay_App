# Push Notification Integration Guide

This document explains how to set up push notifications for MboaPay, specifically for notifying admins when users join circles as pending and notifying users when their membership is approved.

## Overview

The push notification system uses:
- **Expo Notifications** for push token management and local notifications
- **Supabase** for storing push tokens and triggering notifications
- **Supabase Edge Functions** for sending push notifications via Expo's API
- **Real-time event handlers** to trigger notifications when circle membership changes

## Architecture

```
User joins circle (pending)
         ↓
    joinCircleByCode()
         ↓
    Create circle_members record with member_status='pending'
         ↓
    Query circle admins
         ↓
    For each admin:
      - Create notification record in DB
      - Call notifyAdminOfPendingMember()
      - Which calls sendPushNotification()
      - Which invokes Supabase Edge Function
      - Edge Function queries push_tokens table
      - Sends push notification via Expo API
         ↓
    Admin receives push notification
         ↓
    Admin approves member in admin-circle view
         ↓
    approveCircleMember()
         ↓
    Update member_status to 'active'
         ↓
    Call notifyUserOfApproval()
         ↓
    User receives push notification
```

## Setup Instructions

### 1. Create the Push Tokens Table

Run the SQL migration:

```sql
-- In Supabase Dashboard: SQL Editor
-- Copy and run the contents of: supabase/migrations/001_create_push_tokens_table.sql
```

Or using Supabase CLI:
```bash
supabase migration up
```

### 2. Deploy the Edge Function

```bash
# Using Supabase CLI
supabase functions deploy send-push-notification

# Or manually:
# 1. Go to Supabase Dashboard
# 2. Navigate to Edge Functions
# 3. Create new function: send-push-notification
# 4. Paste contents from: supabase/functions/send-push-notification/index.ts
# 5. Deploy
```

### 3. Configure Push Notification Handler (Already Done)

The app is already configured in `context/AppContext.tsx`:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

### 4. Push Token Registration (Already Integrated)

When a user logs in, the app:
1. Requests notification permissions
2. Gets the Expo push token
3. Saves it to `push_tokens` table in Supabase

This happens automatically in the `AppProvider` component.

## How It Works

### When a User Joins a Circle (Pending)

**File:** [context/AppContext.tsx](../context/AppContext.tsx) - `joinCircleByCode()` function

1. User enters circle code and joins
2. For private circles, membership is set to `pending`
3. System queries all circle admins
4. For each admin:
   - Creates a notification record in the `notifications` table
   - Calls `notifyAdminOfPendingMember()` to send a push notification
5. Admin receives a push notification: "New Member Request: [MemberName] requested to join [CircleName]"

### When Admin Approves a Member

**File:** [context/AppContext.tsx](../context/AppContext.tsx) - `approveCircleMember()` function

1. Admin clicks approve button in admin-circle view
2. Member status is updated from `pending` to `active`
3. System creates a notification record
4. Calls `notifyUserOfApproval()` to send a push notification
5. User receives a push notification: "Join Request Approved: Your request to join [CircleName] has been approved!"

## Notification Service Functions

**File:** [lib/notificationService.ts](../lib/notificationService.ts)

### Public Functions

- `registerPushNotifications()` - Request permission and get token
- `savePushToken(userId, token)` - Save token to database
- `getPushToken(userId)` - Retrieve user's push token
- `sendPushNotification(userId, title, body, data)` - Send notification via backend
- `notifyAdminOfPendingMember(adminId, memberName, circleName, circleId)` - Notify admin of join request
- `notifyUserOfApproval(userId, circleName, circleId)` - Notify user of approval
- `notifyAdminOfUnpaidMember(adminId, memberName, circleName, amount, circleId)` - Notify admin of unpaid member

## Database Schema

### push_tokens Table

```sql
id                UUID PRIMARY KEY
user_id           UUID (Foreign Key to auth.users)
token             TEXT (Expo push token)
is_active         BOOLEAN (Default: true)
created_at        TIMESTAMP
updated_at        TIMESTAMP

UNIQUE(user_id, token)
```

## Testing the Integration

### 1. Test Push Token Registration

```typescript
// In your app
import { registerPushNotifications, savePushToken } from '@/lib/notificationService';

// When logged in:
const token = await registerPushNotifications();
if (token && userId) {
  await savePushToken(userId, token);
  console.log("Token saved:", token);
}
```

### 2. Test Sending a Notification

Via Supabase Dashboard:
1. Go to SQL Editor
2. Run:
```sql
SELECT * FROM push_tokens WHERE user_id = 'your-user-id';
```

If token exists, manually invoke the Edge Function:
1. Go to Edge Functions
2. Select `send-push-notification`
3. Run with test payload:
```json
{
  "targetUserId": "user-uuid",
  "title": "Test Notification",
  "body": "This is a test push notification"
}
```

### 3. Test Circle Join Notification

1. Have two users ready
2. User A creates a private circle with invite code
3. User B joins using the code
4. User A should receive a push notification (if app is running)
5. User A approves User B
6. User B should receive a push notification

## Troubleshooting

### Notifications Not Received

1. **Check permissions:**
   - iOS: Settings > [App] > Notifications > Enable
   - Android: Settings > Apps > [App] > Permissions > Notifications

2. **Check push token:**
   - In Supabase Dashboard, check `push_tokens` table
   - Verify token exists and `is_active = true`

3. **Check Edge Function logs:**
   - In Supabase Dashboard: Edge Functions > send-push-notification > Logs
   - Look for errors

4. **Test token validity:**
   - Expo pushes are only delivered to valid, non-expired tokens
   - Tokens can expire after 30 days of inactivity

### Expo Push API Issues

If you get API errors, verify:
1. Network connectivity
2. Expo API is accessible (https://exp.host/--/api/v2/push/send)
3. Push token format is valid
4. Supabase Edge Functions have internet access

## Environment Variables

No additional environment variables needed. The Edge Function uses:
- `SUPABASE_URL` (built-in)
- `SUPABASE_SERVICE_ROLE_KEY` (built-in)

## Production Considerations

1. **Rate Limiting:** Consider implementing rate limiting to prevent notification spam
2. **Batch Sending:** For multiple notifications, batch them to improve performance
3. **Retry Logic:** Implement exponential backoff for failed notifications
4. **Token Cleanup:** Periodically delete inactive tokens (> 30 days)
5. **Analytics:** Track notification delivery and user interaction

## Future Enhancements

- [ ] Add notification preferences (mute, disable for circle)
- [ ] Implement notification badges showing pending requests
- [ ] Add payment reminders for unpaid members
- [ ] Track notification delivery status
- [ ] Add deep linking to navigate directly to relevant screens
- [ ] Implement notification sounds and haptics per notification type

## References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Push API](https://docs.expo.dev/push-notifications/push-notification-setup/)
