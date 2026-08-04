import type {
  FeaturedCompletedSampleCandidate,
  TenantHomepageSettingsPutRequest,
  TenantHomepageSettingsResponse,
} from "@/types/tenant-homepage-settings";

type ApiTenantHomepageSettingsResponse = {
  selectedRunId?: string | null;
  isConfigured?: boolean;
  isAvailable?: boolean;
  reviewTitle?: string | null;
  architectureName?: string | null;
  completedUtc?: string | null;
  isSampleApproved?: boolean;
};

type ApiFeaturedCompletedSampleCandidate = {
  runId?: string;
  reviewTitle?: string;
  architectureName?: string;
  completedUtc?: string;
  isSampleApproved?: boolean;
};

function coerceHomepageSettings(payload: ApiTenantHomepageSettingsResponse): TenantHomepageSettingsResponse {
  return {
    selectedRunId: payload.selectedRunId ?? null,
    isConfigured: payload.isConfigured === true,
    isAvailable: payload.isAvailable === true,
    reviewTitle: payload.reviewTitle ?? null,
    architectureName: payload.architectureName ?? null,
    completedUtc: payload.completedUtc ?? null,
    isSampleApproved: payload.isSampleApproved === true,
  };
}

function coerceCandidate(payload: ApiFeaturedCompletedSampleCandidate): FeaturedCompletedSampleCandidate | null {
  const runId = payload.runId?.trim() ?? "";

  if (runId.length === 0) {
    return null;
  }

  return {
    runId,
    reviewTitle: payload.reviewTitle?.trim() || "Completed review",
    architectureName: payload.architectureName?.trim() || "Architecture review",
    completedUtc: payload.completedUtc ?? "",
    isSampleApproved: payload.isSampleApproved === true,
  };
}

export async function fetchTenantHomepageSettingsClient(): Promise<TenantHomepageSettingsResponse> {
  const response = await fetch("/api/proxy/v1/tenant/homepage-settings", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load workspace homepage settings.");
  }

  const payload = (await response.json()) as ApiTenantHomepageSettingsResponse;

  return coerceHomepageSettings(payload);
}

export async function fetchFeaturedCompletedSampleCandidatesClient(): Promise<FeaturedCompletedSampleCandidate[]> {
  const response = await fetch("/api/proxy/v1/tenant/homepage-settings/eligible-samples", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load eligible sample reviews.");
  }

  const payload = (await response.json()) as ApiFeaturedCompletedSampleCandidate[];

  return payload
    .map(coerceCandidate)
    .filter((candidate): candidate is FeaturedCompletedSampleCandidate => candidate !== null);
}

export async function putTenantHomepageSettingsClient(
  body: TenantHomepageSettingsPutRequest,
): Promise<TenantHomepageSettingsResponse> {
  const response = await fetch("/api/proxy/v1/tenant/homepage-settings", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selectedRunId: body.selectedRunId,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to save workspace homepage settings.");
  }

  const payload = (await response.json()) as ApiTenantHomepageSettingsResponse;

  return coerceHomepageSettings(payload);
}

export function featuredCompletedSampleReviewHref(runId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId.trim())}`;
}
