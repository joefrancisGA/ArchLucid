import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** Trial status fields used to decide whether email verification can be skipped. */
export type SignupVerifyTrialStatusPayload = {
  status?: string;
  trialSampleRunId?: string | null;
  trialWelcomeRunId?: string | null;
};

export type SignupVerifyTrialStatusResult =
  | { readonly kind: "ready"; readonly payload: SignupVerifyTrialStatusPayload }
  | { readonly kind: "pending"; readonly payload: SignupVerifyTrialStatusPayload | null }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "not_found" }
  | { readonly kind: "throttled" }
  | { readonly kind: "error" };

export function isSignupWorkspaceReady(payload: SignupVerifyTrialStatusPayload | null): boolean {
  if (payload === null) {
    return false;
  }

  const sampleId = payload.trialSampleRunId?.trim() ?? "";
  const welcomeId = payload.trialWelcomeRunId?.trim() ?? "";

  if (sampleId.length > 0 || welcomeId.length > 0) {
    return true;
  }

  const status = payload.status?.trim() ?? "";

  return status.length > 0 && status !== "None";
}

/** Post-registration trial-status probe (does not skip for JWT mode — caller handles 401). */
export async function fetchSignupVerifyTrialStatus(): Promise<SignupVerifyTrialStatusResult> {
  try {
    const res = await fetch(
      "/api/proxy/v1/tenant/trial-status",
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
    );

    if (res.status === 401 || res.status === 403) {
      return { kind: "unauthorized" };
    }

    if (res.status === 404) {
      return { kind: "not_found" };
    }

    if (res.status === 429) {
      return { kind: "throttled" };
    }

    if (!res.ok) {
      return { kind: "error" };
    }

    const payload = (await res.json()) as SignupVerifyTrialStatusPayload;

    if (isSignupWorkspaceReady(payload)) {
      return { kind: "ready", payload };
    }

    return { kind: "pending", payload };
  } catch {
    return { kind: "error" };
  }
}
