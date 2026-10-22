import { describe, expect, it } from "vitest";

import { governanceFindingsRegisterFilterHrefFromSearch } from "@/lib/governance/governance-findings-register-filter-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";
import { sanitizeResourceHubQueryForTab } from "@/lib/infra-evidence/infra-evidence-hub-tab-query";
import {
  RESOURCE_HUB_RUN_ID_PARAM,
  resourceHubFilterHrefFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import { INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM } from "@/lib/infra-evidence/infra-resource-hub-technical-disclosure-url";
import { policyPackAuthoringInputModeHrefFromSearch } from "@/lib/policy/policy-pack-authoring-input-mode-url";
import { policyPackCatalogEntryHrefFromSearch } from "@/lib/policy/policy-pack-catalog-entry-url";
import { policyPackGeneratorTemplateHrefFromSearch } from "@/lib/policy/policy-pack-generator-template-url";
import { policyPackSelectionHrefFromSearch } from "@/lib/policy/policy-pack-selection-url";
import {
  POLICY_PACK_COMPARE_LEFT_PARAM,
  POLICY_PACK_COMPARE_RIGHT_PARAM,
  POLICY_PACK_VERSION_DIFF_PARAM,
} from "@/lib/policy/policy-pack-version-compare-url";
import { policyPacksTabHrefFromSearch } from "@/lib/policy/policy-packs-tab-url";

import {
  applyOperatorUrlSelectionSwitch,
  POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS,
} from "./operator-url-selection-switch";

const STALE_POLICY_PACK_VERSION_COMPARE = {
  [POLICY_PACK_VERSION_DIFF_PARAM]: "1",
  [POLICY_PACK_COMPARE_LEFT_PARAM]: "left-stale",
  [POLICY_PACK_COMPARE_RIGHT_PARAM]: "right-stale",
} as const;

function seedSearch(stale: Record<string, string>): string {
  return new URLSearchParams(stale).toString();
}

function expectParamsAbsent(hrefOrQuery: string, paramNames: readonly string[]): void {
  const query = hrefOrQuery.includes("?") ? hrefOrQuery.split("?")[1] ?? "" : hrefOrQuery;
  const params = new URLSearchParams(query);

  for (const paramName of paramNames) {
    expect(params.get(paramName)).toBeNull();
  }
}

describe("operator URL selection switch matrix", () => {
  it("policyPackSelectionHrefFromSearch strips stale version-compare params", () => {
    const current = seedSearch({
      tab: "my-packs",
      packId: "pack-a",
      ...STALE_POLICY_PACK_VERSION_COMPARE,
    });

    const href = policyPackSelectionHrefFromSearch(current, "pack-b");

    expectParamsAbsent(href, POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS);
    expect(href).toContain("packId=pack-b");
  });

  it("policyPackCatalogEntryHrefFromSearch strips stale version-compare params", () => {
    const current = seedSearch({
      tab: "catalog",
      ...STALE_POLICY_PACK_VERSION_COMPARE,
    });

    const href = policyPackCatalogEntryHrefFromSearch(current, "catalog-entry-2");

    expectParamsAbsent(href, POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS);
    expect(href).toContain("catalogEntry=catalog-entry-2");
  });

  it("policyPacksTabHrefFromSearch strips foreign tab params when switching tabs", () => {
    const current = seedSearch({
      tab: "catalog",
      catalogEntry: "entry-1",
      generatorTemplate: "tpl-stale",
      inputMode: "json",
      ...STALE_POLICY_PACK_VERSION_COMPARE,
    });

    const href = policyPacksTabHrefFromSearch(current, "generator");

    expectParamsAbsent(href, ["catalogEntry", "inputMode", ...POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS]);
    expect(href).toContain("generatorTemplate=tpl-stale");
  });

  it("policyPackAuthoringInputModeHrefFromSearch strips stale version-compare params", () => {
    const current = seedSearch({
      tab: "author",
      ...STALE_POLICY_PACK_VERSION_COMPARE,
    });

    const href = policyPackAuthoringInputModeHrefFromSearch(current, "visual");

    expectParamsAbsent(href, POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS);
    expect(href).toContain("inputMode=visual");
  });

  it("policyPackGeneratorTemplateHrefFromSearch strips stale version-compare params", () => {
    const current = seedSearch({
      tab: "generator",
      ...STALE_POLICY_PACK_VERSION_COMPARE,
    });

    const href = policyPackGeneratorTemplateHrefFromSearch(current, "baseline");

    expectParamsAbsent(href, POLICY_PACK_VERSION_COMPARE_QUERY_PARAMS);
    expect(href).toContain("generatorTemplate=baseline");
  });

  it("governanceFindingsRegisterFilterHrefFromSearch strips stale resource-group disclosure", () => {
    const href = governanceFindingsRegisterFilterHrefFromSearch(
      `filter=open&${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=rg-stale`,
      "stale",
    );

    expectParamsAbsent(href, [GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM]);
    expect(href).toContain("filter=stale");
  });

  it("sanitizeResourceHubQueryForTab strips stale overview technical keys on findings tab", () => {
    const current = seedSearch({
      tab: "overview",
      [INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM]: "armResourcePath",
      runId: "run-1",
    });

    const next = sanitizeResourceHubQueryForTab(current, "findings");

    expectParamsAbsent(next, [INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM]);
    expect(new URLSearchParams(next).get(RESOURCE_HUB_RUN_ID_PARAM)).toBe("run-1");
  });

  it("resourceHubFilterHrefFromSearch strips run-scoped audit and item params when runId changes", () => {
    const cloudResourceId = "11111111-1111-1111-1111-111111111111";
    const current = seedSearch({
      tab: "audit",
      runId: "run-old",
      assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      findingId: "finding-stale",
    });

    const href = resourceHubFilterHrefFromSearch(cloudResourceId, current, { runId: "run-new" });

    expectParamsAbsent(href, [
      "assessmentId",
      "auditEvidenceSnapshotId",
      "controlId",
      "findingId",
    ]);
    expect(href).toContain("runId=run-new");
  });

  it("disclosure-only switch is a no-op", () => {
    const params = new URLSearchParams("diff=1");

    applyOperatorUrlSelectionSwitch(params, { kind: "disclosure-only" });

    expect(params.get("diff")).toBe("1");
  });

  it("applyOperatorUrlSelectionSwitch documents each switch kind", () => {
    const params = new URLSearchParams({
      ...STALE_POLICY_PACK_VERSION_COMPARE,
      catalogEntry: "cat",
      generatorTemplate: "gen",
      inputMode: "json",
      [GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM]: "rg",
      [INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM]: "terraformAddress",
      tab: "terraform",
    });

    applyOperatorUrlSelectionSwitch(params, { kind: "policy-packs-tab", tab: "catalog" });
    expect(params.get("catalogEntry")).toBe("cat");
    expect(params.get(POLICY_PACK_VERSION_DIFF_PARAM)).toBeNull();

    applyOperatorUrlSelectionSwitch(params, { kind: "infra-resource-hub-tab", tab: "overview" });
    expect(params.get(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM)).toBeNull();
  });
});
