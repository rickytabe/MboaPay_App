import { pawaPayFetch } from "./client";
import { CURRENCY, PROVIDER_CODES } from "./constants";

export interface InitiatePayoutParams {
  payoutId: string;
  phoneNumber: string;
  provider: string;
  amount: number;
  note?: string;
  referenceId?: string;
}

export async function initiatePayout({
  payoutId,
  phoneNumber,
  provider,
  amount,
  note = "MboaPay payout",
  referenceId = "MBOAPAY-PAY",
}: InitiatePayoutParams) {
  return await pawaPayFetch("/v2/payouts", {
    method: "POST",
    body: JSON.stringify({
      payoutId,
      recipient: {
        type: "MMO",
        accountDetails: {
          phoneNumber,
          provider,
        },
      },
      clientReferenceId: referenceId,
      customerMessage: note.substring(0, 22),
      amount: String(amount),
      currency: CURRENCY,
    }),
  });
}

export async function checkPayoutStatus(payoutId: string) {
  return await pawaPayFetch(`/v2/payouts/${payoutId}`);
}

export async function pollPayoutUntilFinal(payoutId: string, options = { intervalMs: 3000, timeoutMs: 60000 }) {
  const start = Date.now();
  while (Date.now() - start < options.timeoutMs) {
    const result = await checkPayoutStatus(payoutId);
    if (["COMPLETED", "FAILED"].includes(result[0]?.status || result.status)) {
      return Array.isArray(result) ? result[0] : result;
    }
    await new Promise((r) => setTimeout(r, options.intervalMs));
  }
  throw new Error("Payout status polling timed out");
}
