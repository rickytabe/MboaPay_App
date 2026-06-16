import { pawaPayFetch } from "./client";
import { CURRENCY } from "./constants";

export interface InitiateRefundParams {
  refundId: string;
  depositId: string;
  amount?: number;
}

export async function initiateRefund({
  refundId,
  depositId,
  amount,
}: InitiateRefundParams) {
  return await pawaPayFetch("/v2/refunds", {
    method: "POST",
    body: JSON.stringify({
      refundId,
      depositId,
      ...(amount !== undefined && { amount: String(amount) }),
      currency: CURRENCY,
    }),
  });
}

export async function checkRefundStatus(refundId: string) {
  return await pawaPayFetch(`/v2/refunds/${refundId}`);
}

export async function pollRefundUntilFinal(refundId: string, options = { intervalMs: 3000, timeoutMs: 60000 }) {
  const start = Date.now();
  while (Date.now() - start < options.timeoutMs) {
    const result = await checkRefundStatus(refundId);
    if (["COMPLETED", "FAILED"].includes(result[0]?.status || result.status)) {
      return Array.isArray(result) ? result[0] : result;
    }
    await new Promise((r) => setTimeout(r, options.intervalMs));
  }
  throw new Error("Refund status polling timed out");
}
