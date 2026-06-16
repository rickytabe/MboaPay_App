import { pawaPayFetch } from "./client";

export async function predictProvider(phoneNumber: string): Promise<{ country: string; provider: string; phoneNumber: string }> {
  return await pawaPayFetch("/v2/predict-provider", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
}

export async function getActiveConfiguration() {
  return await pawaPayFetch("/v2/active-conf");
}

export async function checkProviderAvailability() {
  return await pawaPayFetch("/v2/availability");
}
