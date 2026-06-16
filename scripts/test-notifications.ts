#!/usr/bin/env node

/**
 * Push Notification Quick Start Script
 * 
 * This script helps you quickly test the push notification system
 * 
 * Usage:
 *   npx ts-node scripts/test-notifications.ts
 */

import { sendTestPushNotification, checkUserPushTokens } from '../lib/notificationTesting';

async function main() {
  console.log('🔔 Push Notification Quick Test\n');

  // Get user ID from environment or prompt
  const userId = process.env.TEST_USER_ID;
  
  if (!userId) {
    console.error('❌ Please set TEST_USER_ID environment variable');
    console.log('   Example: export TEST_USER_ID="your-user-uuid"');
    process.exit(1);
  }

  try {
    // Step 1: Check existing tokens
    console.log('📱 Step 1: Checking push tokens...\n');
    const tokens = await checkUserPushTokens(userId);
    
    if (tokens.length === 0) {
      console.log('⚠️  No push tokens found for this user');
      console.log('   Make sure the app is open and notification permissions are granted\n');
    } else {
      console.log(`✅ Found ${tokens.length} push token(s)\n`);
      tokens.forEach((token, index) => {
        console.log(`   Token ${index + 1}:`);
        console.log(`   - Active: ${token.is_active}`);
        console.log(`   - Created: ${new Date(token.created_at).toLocaleString()}\n`);
      });
    }

    // Step 2: Send test notification
    console.log('📤 Step 2: Sending test notification...\n');
    const success = await sendTestPushNotification(
      userId,
      '🔔 Test Notification',
      'If you see this, push notifications are working!'
    );

    if (success) {
      console.log('✅ Test notification sent successfully!\n');
      console.log('   Check your device for the notification');
      console.log('   (May take a few seconds to arrive)\n');
    } else {
      console.log('❌ Failed to send test notification\n');
      console.log('   Check that:');
      console.log('   1. Push tokens exist for this user');
      console.log('   2. Edge Function is deployed');
      console.log('   3. Notification permissions are granted\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
