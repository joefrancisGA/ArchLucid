import { describe, expect, it } from "vitest";
import { ATTACK_PATH_REPORT_UNEVALUATED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/remediation-factory/attack-path-report-unevaluated-empty-not-load-failure-copy";

describe("score-lift round127 batch honesty", () => {
  it("unevaluated subsection empty", () => {
    expect(ATTACK_PATH_REPORT_UNEVALUATED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
