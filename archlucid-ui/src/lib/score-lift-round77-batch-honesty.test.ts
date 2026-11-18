import { describe, expect, it } from "vitest";

import { formatRemediationWorkbenchActiveFiltersSummary } from "@/lib/infra-evidence/remediation-workbench-active-filters-summary-copy";
import { CONNECTION_STATUS_CATEGORY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/integrations/connection-status-category-filter-empty-not-load-failure-copy";
import { CONNECTION_STATUS_CATEGORY_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/integrations/connection-status-category-filter-empty-partial-capture-copy";
import { POLICY_PACKS_CATALOG_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-catalog-load-failure-partial-capture-copy";
import { REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_ONLY_NOT_LOAD_FAILURE_LINE } from "@/lib/remediation-factory/remediation-factory-attack-path-unevaluated-only-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_JOB_VIEW_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-job-view-filter-empty-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_JOB_VIEW_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-job-view-filter-no-match-partial-capture-copy";

describe("score-lift round77 batch honesty", () => {
  it("remediation filters, connection category, catalog RP, attack path unevaluated, findings job view", () => {
    expect(formatRemediationWorkbenchActiveFiltersSummary("In progress", "wave-1")).toContain("wave-1");
    expect(CONNECTION_STATUS_CATEGORY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("category");
    expect(CONNECTION_STATUS_CATEGORY_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(POLICY_PACKS_CATALOG_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("My packs");
    expect(REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_ONLY_NOT_LOAD_FAILURE_LINE).toContain("unevaluated");
    expect(GOVERNANCE_FINDINGS_JOB_VIEW_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("job view");
    expect(GOVERNANCE_FINDINGS_JOB_VIEW_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE).toContain("gaps");
  });
});