# Push Notification Integration - Deployment Checklist

## Pre-Deployment Verification

- [ ] All files created successfully
- [ ] No compilation errors
- [ ] Code follows project patterns
- [ ] Tests planned

## Deployment Steps

### Step 1: Database Migration
- [ ] Access Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Create new query
- [ ] Copy contents from: `supabase/migrations/001_create_push_tokens_table.sql`
- [ ] Execute the migration
- [ ] Verify `push_tokens` table created
- [ ] Verify RLS policies are applied

### Step 2: Deploy Edge Function
- [ ] Access Supabase Dashboard
- [ ] Navigate to Edge Functions
- [ ] Create new function: `send-push-notification`
- [ ] Copy contents from: `supabase/functions/send-push-notification/index.ts`
- [ ] Deploy the function
- [ ] Verify function is deployed successfully
- [ ] Check function logs are accessible

### Step 3: Application Testing

**Test Scenario 1: Token Registration**
- [ ] Start app (fresh install or clear data)
- [ ] Allow notification permissions when prompted
- [ ] Wait 10 seconds
- [ ] In Supabase Dashboard, check `push_tokens` table
- [ ] Verify new token exists for logged-in user
- [ ] Verify `is_active = true`

**Test Scenario 2: Admin Notification on Join**
- [ ] Create two test user accounts
- [ ] User A: Create a private circle
- [ ] User B: Join using circle code
- [ ] User A: Keep app active or check notifications
- [ ] ✅ Verify User A receives push notification about User B's request
- [ ] Check notification shows: "[User B's name] requested to join [Circle name]"

**Test Scenario 3: User Notification on Approval**
- [ ] From previous scenario, User B is still pending
- [ ] User A: Open admin-circle view
- [ ] User A: Click approve on User B's membership
- [ ] User B: Keep app active or check notifications
- [ ] ✅ Verify User B receives push notification about approval
- [ ] Check notification shows: "Your request to join [Circle name] has been approved!"

**Test Scenario 4: Error Handling**
- [ ] Try joining with invalid code
- [ ] Try approving non-existent member
- [ ] Disconnect network and try joining
- [ ] ✅ Verify app handles errors gracefully

### Step 4: Monitoring

- [ ] Set up monitoring for Edge Function errors
- [ ] Monitor push_tokens table size
- [ ] Monitor notification delivery rates
- [ ] Set up alerts for high error rates

### Step 5: Production Deployment

- [ ] Create a backup of database
- [ ] Run migration on production database
- [ ] Deploy Edge Function to production
- [ ] Test all scenarios on production
- [ ] Monitor for 24 hours
- [ ] Document any issues encountered

## Rollback Plan

If issues occur:

1. **Disable notifications temporarily:**
   ```typescript
   // In notificationService.ts, comment out:
   // return sendPushNotificationViaBackend(...)
   // return true; // Skip for now
   ```

2. **Remove Edge Function:**
   - Supabase Dashboard > Edge Functions
   - Delete send-push-notification
   - Notifications will fallback to local only

3. **Rollback Database:**
   ```sql
   DROP TABLE IF EXISTS push_tokens;
   ```

## Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Collect user feedback on notifications
- [ ] Verify notification delivery rates > 95%
- [ ] Document any issues found
- [ ] Plan improvements

## Success Criteria

✅ Push notifications successfully sent to admins when users join
✅ Push notifications successfully sent to users when approved
✅ No errors in Edge Function logs
✅ Push tokens properly stored and managed
✅ Old tokens cleaned up automatically
✅ Users can opt-in to notifications
✅ All test scenarios pass

## Quick Command Reference

```bash
# Supabase CLI - Database
supabase migration list
supabase migration up
supabase db pull

# Supabase CLI - Functions
supabase functions deploy send-push-notification
supabase functions list
supabase functions logs send-push-notification
```

## Files to Review

Before deployment, review these files:
1. ✅ [lib/notificationService.ts](../lib/notificationService.ts) - Service logic
2. ✅ [context/AppContext.tsx](../context/AppContext.tsx) - App integration
3. ✅ [supabase/migrations/001_create_push_tokens_table.sql](../supabase/migrations/001_create_push_tokens_table.sql) - Database schema
4. ✅ [supabase/functions/send-push-notification/index.ts](../supabase/functions/send-push-notification/index.ts) - Edge Function
5. ✅ [docs/PUSH_NOTIFICATIONS_SETUP.md](../docs/PUSH_NOTIFICATIONS_SETUP.md) - Full documentation

## Contact & Support

For questions or issues during deployment:
- Review [PUSH_NOTIFICATION_IMPLEMENTATION.md](../PUSH_NOTIFICATION_IMPLEMENTATION.md)
- Check [docs/PUSH_NOTIFICATIONS_SETUP.md](../docs/PUSH_NOTIFICATIONS_SETUP.md)
- Use [lib/notificationTesting.ts](../lib/notificationTesting.ts) for debugging

---

**Status:** Ready for Deployment ✅
**Estimated Deployment Time:** 15-30 minutes
**Risk Level:** Low (feature is isolated and has fallbacks)
