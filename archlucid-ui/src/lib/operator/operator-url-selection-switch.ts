import {
  RESOURCE_HUB_CORRESPONDENCE_ID_PARAM,
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  RESOURCE_HUB_DIFF_ID_PARAM,
  RESOURCE_HUB_FINDING_ID_PARAM,
  RESOURCE_HUB_INSTANCE_ID_PARAM,
  RESOURCE_HUB_SEED_NODE_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM } from "@/lib/infra-evidence/infra-resource-hub-technical-disclosure-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";
import { POLICY_PACK_AUTHORING_INPUT_MODE_PARAM } from "@/lib/policy/policy-pack-authoring-input-mode-url";
import { POLICY_PACK_CATALOG_ENTRY_PARAM } from "@/lib/policy/policy-pack-catalog-entry-url";
import { POLICY_PACK_GENERATOR_TEMPLATE_PARAM } from "@/lib/policy/policy-pack-generator-template-url";
import {
  POLICY_PACK_COMPARE_LEFT_PARAM,
  POLICY_PACK_COMPARE_RIGHT_PARAM,
  POLICY_PACK_VERSION_DIFF_PARAM,
} from "@/lib/policy/policy-pack-version-compare-url";

export const POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS = [
  POLICY_PACK_VERSION_DIFF_PARAM,
  POLICY_PACK_COMPARE_LEFT_PARAM,
  POLICY_PACK_COMPARE_RIGHT_PARAM,
] as const;

export type PolicyPacksHubTabId = "my-packs" | "catalog" | "generator" | "author";

export type OperatorUrlSelectionSwitch =
  | { readonly kind: "disclosure-only" }
  | { readonly kind: "policy-pack-selection" }
  | { readonly kind: "policy-pack-catalog-entry" }
  | { readonly kind: "policy-packs-tab"; readonly tab: PolicyPacksHubTabId }
  | { readonly kind: "policy-pack-authoring-input-mode" }
  | { readonly kind: "policy-pack-generator-template" }
  | { readonly kind: "governance-findings-register-filter" }
  | { readonly kind: "governance-findings-queue-navigation" }
  | { readonly kind: "infra-resource-hub-tab"; readonly tab: ResourceHubTab }
  | { readonly kind: "infra-resource-hub-run-scope" };

export function stripUrlSearchParams(params: URLSearchParams, paramNames: readonly string[]): void {
  for (const paramName of paramNames) {
    params.delete(paramName);
  }
}

export function stripPolicyPackVersionCompareParams(params: URLSearchParams): void {
  stripUrlSearchParams(params, POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS);
}

/** Params owned by a single policy-packs hub tab; strip foreign tab keys on tab switch. */
export function stripPolicyPacksTabForeignParams(params: URLSearchParams, activeTab: PolicyPacksHubTabId): void {
  if (activeTab !== "catalog") {
    params.delete(POLICY_PACK_CATALOG_ENTRY_PARAM);
  }

  if (activeTab !== "generator") {
    params.delete(POLICY_PACK_GENERATOR_TEMPLATE_PARAM);
  }

  if (activeTab !== "author") {
    params.delete(POLICY_PACK_AUTHORING_INPUT_MODE_PARAM);
  }

  if (activeTab !== "my-packs") {
    stripPolicyPackVersionCompareParams(params);
  }
}

/** Audit and per-item hub params are scoped to the active review run in the URL. */
export function stripInfraResourceHubRunScopedParams(params: URLSearchParams): void {
  stripUrlSearchParams(params, [
    RESOURCE_HUB_ASSESSMENT_ID_PARAM,
    RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
    RESOURCE_HUB_CONTROL_ID_PARAM,
    RESOURCE_HUB_FINDING_ID_PARAM,
    RESOURCE_HUB_DIFF_ID_PARAM,
    RESOURCE_HUB_INSTANCE_ID_PARAM,
    RESOURCE_HUB_CORRESPONDENCE_ID_PARAM,
    RESOURCE_HUB_SEED_NODE_ID_PARAM,
  ]);
}

/** Drop hub item-scoped and tab-scoped disclosure params that do not apply to the active tab. */
export function applyInfraResourceHubTabParamOwnership(params: URLSearchParams, tab: ResourceHubTab): void {
  if (tab !== "findings") {
    params.delete(RESOURCE_HUB_FINDING_ID_PARAM);
  }

  if (tab !== "drift") {
    params.delete(RESOURCE_HUB_DIFF_ID_PARAM);
  }

  if (tab !== "remediation") {
    params.delete(RESOURCE_HUB_INSTANCE_ID_PARAM);
  }

  if (tab !== "diagram") {
    params.delete(RESOURCE_HUB_CORRESPONDENCE_ID_PARAM);
    params.delete(RESOURCE_HUB_SEED_NODE_ID_PARAM);
  }

  const technicalKey = params.get(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM)?.trim() ?? "";

  if (technicalKey.length === 0) {
    return;
  }

  const overviewOnlyKeys = new Set(["cloudResourceId", "armResourcePath"]);

  if (tab !== "terraform" && technicalKey === "terraformAddress") {
    params.delete(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM);
  } else if (tab !== "overview" && overviewOnlyKeys.has(technicalKey)) {
    params.delete(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM);
  }
}

export function applyOperatorUrlSelectionSwitch(
  params: URLSearchParams,
  selectionSwitch: OperatorUrlSelectionSwitch,
): void {
  switch (selectionSwitch.kind) {
    case "disclosure-only":
      break;
    case "policy-pack-selection":
    case "policy-pack-catalog-entry":
    case "policy-pack-authoring-input-mode":
    case "policy-pack-generator-template":
      stripPolicyPackVersionCompareParams(params);
      break;
    case "policy-packs-tab":
      stripPolicyPacksTabForeignParams(params, selectionSwitch.tab);
      break;
    case "governance-findings-register-filter":
    case "governance-findings-queue-navigation":
      params.delete(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
      break;
    case "infra-resource-hub-tab":
      applyInfraResourceHubTabParamOwnership(params, selectionSwitch.tab);
      break;
    case "infra-resource-hub-run-scope":
      stripInfraResourceHubRunScopedParams(params);
      break;
    default: {
      const unhandled: never = selectionSwitch;
      throw new Error(`Unhandled operator URL selection switch: ${(unhandled as OperatorUrlSelectionSwitch).kind}`);
    }
  }
}
