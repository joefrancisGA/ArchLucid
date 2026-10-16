import { describe, expect, it } from "vitest";

import {
  presentRunExplanationHeadlineCount,
  resolveRunExplanationFindingCountForHeadline,
  RUN_EXPLANATION_DECISION_COUNT_NOT_STORED_LABEL,
  RUN_EXPLANATION_FINDING_COUNT_NOT_STORED_LABEL,
} from "@/lib/runs/run-explanation-headline-stats-display";

describe("resolveRunExplanationFindingCountForHeadline", () => {
  it("does not coerce invalid override into summary count", () => {
    expect(resolveRunExplanationFindingCountForHeadline(Number.NaN, 5)).toBe(
      RUN_EXPLANATION_FINDING_COUNT_NOT_STORED_LABEL,
    );
  });

  it("returns a stored finding count when finite", () => {
    expect(resolveRunExplanationFindingCountForHeadline(2, undefined)).toBe("2");
  });
});

describe("presentRunExplanationHeadlineCount", () => {
  it("uses field-specific not-stored copy instead of Not returned", () => {
    expect(presentRunExplanationHeadlineCount(null, RUN_EXPLANATION_DECISION_COUNT_NOT_STORED_LABEL)).toBe(
      RUN_EXPLANATION_DECISION_COUNT_NOT_STORED_LABEL,
    );
    expect(presentRunExplanationHeadlineCount(3, RUN_EXPLANATION_DECISION_COUNT_NOT_STORED_LABEL)).toBe("3");
  });
});
