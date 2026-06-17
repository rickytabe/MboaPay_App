import { supabase } from "./supabase";
import { initiatePayout, pollPayoutUntilFinal } from "./pawapay/payouts";
import { PROVIDER_CODES } from "./pawapay/constants";

export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const checkAndTriggerDisbursement = async (circleId: string, triggeringMemberId?: string) => {
  try {
    // 1. Fetch circle details
    const { data: circle, error: circleError } = await supabase
      .from("circles")
      .select("*")
      .eq("id", circleId)
      .single();

    if (circleError || !circle) throw new Error("Circle not found");

    if (circle.circle_type === "solo" || circle.circle_type === "pool") {
      // Logic for Solo/Pool: Individual member hits target
      if (!triggeringMemberId) return;

      // Sum successful contributions for this member
      const { data: contributions } = await supabase
        .from("contributions")
        .select("amount")
        .eq("circle_id", circleId)
        .eq("member_id", triggeringMemberId)
        .eq("status", "successful");

      const totalContributed = (contributions || []).reduce((sum, c) => sum + Number(c.amount), 0);

      if (totalContributed >= circle.target_amount) {
        // Fetch member user details to get phone and provider
        const { data: member } = await supabase
          .from("circle_members")
          .select("user_id, users(phone, mno_provider)")
          .eq("id", triggeringMemberId)
          .single();

        if (member && member.users) {
          await executePayout(
            circleId,
            member.user_id,
            (member.users as any).phone,
            (member.users as any).mno_provider || "MTN",
            circle.target_amount,
            null, // No round_number for solo/pool
            circle.name
          );
        }
      }
    } else if (circle.circle_type === "rotation") {
      // Logic for Rotation: All active members paid for current round
      // Determine current round
      const { data: disbursements } = await supabase
        .from("disbursements")
        .select("round_number")
        .eq("circle_id", circleId)
        .order("round_number", { ascending: false })
        .limit(1);

      const currentRound = disbursements && disbursements.length > 0 
        ? (disbursements[0].round_number || 0) + 1 
        : 1;

      // Get all active members
      const { data: activeMembers } = await supabase
        .from("circle_members")
        .select("id, user_id, rotation_order, users(phone, mno_provider)")
        .eq("circle_id", circleId)
        .eq("member_status", "active")
        .order("rotation_order", { ascending: true });

      if (!activeMembers || activeMembers.length === 0) return;

      // Check if all active members have a successful contribution for currentRound
      const { data: roundContributions } = await supabase
        .from("contributions")
        .select("member_id")
        .eq("circle_id", circleId)
        .eq("cycle_number", currentRound)
        .eq("status", "successful");

      const paidMemberIds = new Set((roundContributions || []).map(c => c.member_id));
      const allPaid = activeMembers.every(m => paidMemberIds.has(m.id));

      if (allPaid) {
        // Total amount = number of active members * contribution_amount
        const payoutAmount = activeMembers.length * circle.contribution_amount;

        // Determine recipient based on rotation_order
        // e.g. round 1 -> rotation_order 1 (or lowest)
        // If rounds > members, it wraps around using modulo
        const zeroIndexRound = currentRound - 1;
        const recipientIndex = zeroIndexRound % activeMembers.length;
        const recipient = activeMembers[recipientIndex];

        if (recipient) {
          await executePayout(
            circleId,
            recipient.user_id,
            (recipient.users as any).phone,
            (recipient.users as any).mno_provider || "MTN",
            payoutAmount,
            currentRound,
            circle.name
          );
        }
      }
    }
  } catch (error) {
    console.error("[checkAndTriggerDisbursement] Error:", error);
  }
};

const executePayout = async (
  circleId: string,
  recipientUserId: string,
  phone: string,
  operator: string,
  amount: number,
  roundNumber: number | null,
  circleName: string
) => {
  const payoutId = generateId();
  const provider = operator === 'MTN' ? PROVIDER_CODES.MTN : PROVIDER_CODES.ORANGE;

  // Insert pending disbursement
  await supabase.from("disbursements").insert({
    id: payoutId,
    circle_id: circleId,
    recipient_id: recipientUserId,
    pawapay_payout_id: payoutId,
    amount,
    round_number: roundNumber,
    trigger_type: "auto",
    status: "pending"
  });

  try {
    // Initiate payout
    await initiatePayout({ 
      payoutId, 
      phoneNumber: phone, 
      provider, 
      amount, 
      note: `Circle Payout: ${circleName}` 
    });

    const finalStatus = await pollPayoutUntilFinal(payoutId);

    if (finalStatus.status === "COMPLETED") {
      // Update disbursement
      await supabase.from("disbursements").update({ 
        status: "successful", 
        disbursed_at: new Date().toISOString() 
      }).eq("id", payoutId);

      // Insert matching transaction for recipient
      await supabase.from("transactions").insert({
        user_id: recipientUserId,
        type: "disbursement",
        amount,
        pawapay_ref: payoutId,
        status: "successful",
        mno_provider: operator,
        metadata: { circleName, roundNumber }
      });

      // Send notifications
      await supabase.from("notifications").insert({
        user_id: recipientUserId,
        type: "circle_payout",
        title: "Payout Received!",
        message: `You received ${amount.toLocaleString()} XAF from ${circleName}.`
      });

    } else {
      // Mark failed
      await supabase.from("disbursements").update({ status: "failed" }).eq("id", payoutId);
    }
  } catch (error) {
    console.error("Payout execution failed:", error);
    await supabase.from("disbursements").update({ status: "failed" }).eq("id", payoutId);
  }
};
