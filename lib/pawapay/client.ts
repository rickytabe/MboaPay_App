import { PAWAPAY_BASE_URL, PAWAPAY_TOKEN } from "./constants";

export async function pawaPayFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${PAWAPAY_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${PAWAPAY_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.failureReason?.failureMessage || data?.errorMessage || "pawaPay request failed");
  }
  return data;
}
