import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { crossTenantPortfolioBlockedReason } from "@/lib/roi/cross-tenant-portfolio-blocked-reason";

const CROSS_TENANT_PORTFOLIO_PATH = `/api/proxy/${ApiV1Routes.roiCrossTenantPortfolio}`;

export type CrossTenantPortfolioSummary = {
  isKAnonymitySatisfied: boolean;
  totalEstimatedUsdSavings?: number;
  totalSystemCount?: number;
  totalCriticalFindings?: number;
};

/** Browser fetch for cross-tenant portfolio headline metrics. */
export async function fetchCrossTenantPortfolioClient(): Promise<CrossTenantPortfolioSummary> {
  try {
    return await proxyJsonGet<CrossTenantPortfolioSummary>(CROSS_TENANT_PORTFOLIO_PATH);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = crossTenantPortfolioBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(error));
  }
}
