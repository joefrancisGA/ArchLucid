import { describe, expect, it } from "vitest";

import { REMEDIATION_FACTORY_SIMULATOR_RANK_DISCIPLINE } from "@/lib/remediation-factory-simulator-rank-honesty-copy";
import { SECURENOW_DIAGRAM_FILTER_EMPTY_LINE } from "@/lib/product-line/securenow-diagram-filter-empty-copy";
import { SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE } from "@/lib/product-line/securenow-partial-capture-honesty-copy";
import { SECURENOW_PATH_INSPECT_CITATION_ALLOWED_REFS_LEAD } from "@/lib/product-line/securenow-path-inspect-citation-allowed-copy";
import { FIRST_REVIEW_GUIDE_AFTER_PREREQUISITES_BODY } from "@/lib/first-review-guide-after-prerequisites-copy";
import { troubleshootingHostedSaasOpenAiNote } from "@/lib/troubleshooting-help-guide-content";
import { ATTACK_PATH_REPORT_DIAGRAM_FILTER_EMPTY } from "@/app/(operator)/governance/remediation-factory/resolve-attack-path-report-snapshot-id";

describe("score-lift round 41 rescore honesty", () => {
  it("keeps shared diagram-empty and attack-path copy aligned", () => {
    expect(ATTACK_PATH_REPORT_DIAGRAM_FILTER_EMPTY).toBe(SECURENOW_DIAGRAM_FILTER_EMPTY_LINE);
  });

  it("keeps operator honesty modules stable", () => {
    expect(REMEDIATION_FACTORY_SIMULATOR_RANK_DISCIPLINE).toContain("does not change path rank");
    expect(SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE).toContain("gaps");
    expect(SECURENOW_PATH_INSPECT_CITATION_ALLOWED_REFS_LEAD).toContain("stored hop");
    expect(FIRST_REVIEW_GUIDE_AFTER_PREREQUISITES_BODY).toContain("tenant architecture review");
    expect(troubleshootingHostedSaasOpenAiNote("architecture")).toContain("platform-provisioned Azure OpenAI");
  });
});