import { describe, expect, it } from "vitest";

import { ARCHITECTURE_COMPARE_PARTIAL_SECURENOW_INVENTORY_FOOTNOTE } from "@/lib/architecture/architecture-compare-partial-inventory-footnote-copy";
import { DECISION_REGISTER_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/decision-register-filter-empty-not-load-failure-copy";
import {
  DIGESTS_BROWSE_SCOPED_REVIEW_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE,
  DIGESTS_BROWSE_SCOPED_REVIEW_FILTER_EMPTY_TITLE,
} from "@/lib/digests-browse-scoped-filter-empty-copy";
import { INFRASTRUCTURE_ASK_PARTIAL_CAPTURE_HONESTY_LINE } from "@/lib/infra-evidence/infrastructure-ask-partial-capture-honesty-copy";
import {
  attackPathReportPathChipOverflowLine,
  formatAttackPathReportPathChipLabel,
} from "@/lib/remediation-factory/attack-path-report-path-chip-label";
import { REMEDIATION_FACTORY_ATTACK_PATH_TABLE_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-attack-path-table-partial-capture-copy";
import { REMEDIATION_PATTERNS_FILTER_NO_MATCH_NOT_LOAD_FAILURE_LINE } from "@/lib/remediation-pattern/remediation-patterns-filter-no-match-not-load-failure-copy";

describe("score-lift round63 batch honesty", () => {
  it("compare, digest browse, attack path, patterns, and register copy", () => {
    expect(ARCHITECTURE_COMPARE_PARTIAL_SECURENOW_INVENTORY_FOOTNOTE).toContain("gaps");
    expect(DIGESTS_BROWSE_SCOPED_REVIEW_FILTER_EMPTY_TITLE).toContain("review");
    expect(DIGESTS_BROWSE_SCOPED_REVIEW_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("failed");
    expect(REMEDIATION_FACTORY_ATTACK_PATH_TABLE_PARTIAL_CAPTURE_LINE).toContain("subscription");
    expect(REMEDIATION_PATTERNS_FILTER_NO_MATCH_NOT_LOAD_FAILURE_LINE).toContain("filters");
    expect(DECISION_REGISTER_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("filter-empty");
    expect(INFRASTRUCTURE_ASK_PARTIAL_CAPTURE_HONESTY_LINE).toContain("gaps");
  });

  it("attack path path chip labels", () => {
    const shortId = "path-short";

    expect(formatAttackPathReportPathChipLabel(shortId)).toBe(shortId);
    expect(
      attackPathReportPathChipOverflowLine([
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-ffffffffffff-gggggggggggg",
      ]),
    ).not.toBeNull();
  });
});