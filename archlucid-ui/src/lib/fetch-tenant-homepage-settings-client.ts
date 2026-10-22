import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";
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
  const payload = await proxyJsonGet<ApiTenantHomepageSettingsResponse>("/api/proxy/v1/tenant/homepage-settings", {
    cache: "no-store",
  });

  return coerceHomepageSettings(payload);
}

export async function fetchFeaturedCompletedSampleCandidatesClient(): Promise<FeaturedCompletedSampleCandidate[]> {
  const payload = await proxyJsonGet<ApiFeaturedCompletedSampleCandidate[]>(
    "/api/proxy/v1/tenant/homepage-settings/eligible-samples",
    { cache: "no-store" },
  );

  return payload
    .map(coerceCandidate)
    .filter((candidate): candidate is FeaturedCompletedSampleCandidate => candidate !== null);
}

export async function putTenantHomepageSettingsClient(
  body: TenantHomepageSettingsPutRequest,
): Promise<TenantHomepageSettingsResponse> {
  const payload = await proxyJsonPut<ApiTenantHomepageSettingsResponse>(
    "/api/proxy/v1/tenant/homepage-settings",
    { selectedRunId: body.selectedRunId },
  );

  return coerceHomepageSettings(payload);
}

export function featuredCompletedSampleReviewHref(runId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId.trim())}`;
}
