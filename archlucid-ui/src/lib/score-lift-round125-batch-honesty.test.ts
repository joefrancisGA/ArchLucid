import { describe, expect, it } from "vitest";
import { ATTACK_PATH_REPORT_VULNERABLE_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/remediation-factory/attack-path-report-vulnerable-empty-not-load-failure-copy";
import { DIGESTS_BROWSE_SCOPED_AND_SUBSCRIPTION_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/digests/digests-browse-scoped-and-subscription-filter-empty-not-load-failure-copy";

describe("score-lift round125 batch honesty", () => {
  it("vulnerable empty and digest scoped subscription", () => {
    expect(ATTACK_PATH_REPORT_VULNERABLE_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(DIGESTS_BROWSE_SCOPED_AND_SUBSCRIPTION_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE.length).toBeGreaterThan(20);
  });
});
