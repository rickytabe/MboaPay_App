import { pawaPayFetch } from "./client";
import { CURRENCY, PROVIDER_CODES } from "./constants";

export interface InitiateDepositParams {
  depositId: string;
  phoneNumber: string;
  provider: string;
  amount: number;
  note?: string;
  referenceId?: string;
}

export async function initiateDeposit({
  depositId,
  phoneNumber,
  provider,
  amount,
  note = "MboaPay deposit",
  referenceId = "MBOAPAY-DEP",
}: InitiateDepositParams) {
  return await pawaPayFetch("/v2/deposits", {
    method: "POST",
    body: JSON.stringify({
      depositId,
      payer: {
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

export async function checkDepositStatus(depositId: string) {
  return await pawaPayFetch(`/v2/deposits/${depositId}`);
}

export async function pollDepositUntilFinal(depositId: string, options = { intervalMs: 3000, timeoutMs: 60000 }) {
  const start = Date.now();
  while (Date.now() - start < options.timeoutMs) {
    const result = await checkDepositStatus(depositId);
    if (["COMPLETED", "FAILED"].includes(result[0]?.status || result.status)) {
      return Array.isArray(result) ? result[0] : result;
    }
    await new Promise((r) => setTimeout(r, options.intervalMs));
  }
  throw new Error("Deposit status polling timed out");
}
