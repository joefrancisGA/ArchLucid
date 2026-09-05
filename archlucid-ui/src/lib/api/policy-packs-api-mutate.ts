import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { components } from "@/lib/openapi-schemas";
import {
  POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE,
  POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE,
  type PolicyPackDryRunRequest,
  type PolicyPackDryRunResponse,
} from "@/types/policy-pack-dry-run";
import type { PolicyPack, PolicyPackVersion } from "@/types/policy-packs";
import { apiPostJson } from "./http";

/** Creates a new policy pack with an initial content document. */
export async function createPolicyPack(body: {
  name: string;
  description?: string;
  packType: string;
  initialContentJson?: string;
}): Promise<PolicyPack> {
  return apiPostJson<PolicyPack>(`/${ApiV1Routes.policyPacks}`, body);
}

/** Publishes a new version of a policy pack with optional updated content. */
export async function publishPolicyPackVersion(
  policyPackId: string,
  body: { version: string; contentJson?: string },
): Promise<PolicyPackVersion> {
  return apiPostJson<PolicyPackVersion>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/publish`,
    body,
  );
}

/**
 * Dry-runs proposed threshold changes for a policy pack against a list of historic runs without
 * committing anything (POST `/v1/governance/policy-packs/{id}/dry-run`).
 */
export async function dryRunPolicyPack(
  policyPackId: string,
  body: PolicyPackDryRunRequest,
  options?: { page?: number; pageSize?: number },
): Promise<PolicyPackDryRunResponse> {
  const pageSize = clampDryRunPageSize(options?.pageSize);
  const page = clampDryRunPage(options?.page);
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  return apiPostJson<PolicyPackDryRunResponse>(
    `/${ApiV1Routes.policyPacks}/${encodeURIComponent(policyPackId)}/dry-run?${query.toString()}`,
    body,
  );
}

function clampDryRunPageSize(input: number | undefined): number {
  if (input === undefined || !Number.isFinite(input)) {
    return POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE;
  }

  if (input < 1) {
    return POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(input), POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE);
}

function clampDryRunPage(input: number | undefined): number {
  if (input === undefined || !Number.isFinite(input) || input < 1) {
    return 1;
  }

  return Math.floor(input);
}

/**
 * Dry-runs proposed policy pack content against a single authority run (pre-commit gate semantics).
 * Matches {@code POST /v1/policy-packs/simulate}. Requires ReadAuthority.
 */
export async function simulatePolicyPackAgainstRun(
  body: components["schemas"]["PolicyPackSimulateRequest"],
): Promise<components["schemas"]["PolicyPackGovernanceDryRunResult"]> {
  return apiPostJson<components["schemas"]["PolicyPackGovernanceDryRunResult"]>(
    `/${ApiV1Routes.policyPacks}/simulate`,
    body,
  );
}
