import { describe, expect, it } from "vitest";

import {
  COMPARE_EMPTY_DIFF_REASON_IDS,
  COMPARE_VERDICT_ZERO_CHANGES_TEACHING,
  buildCompareEmptyDiffTeaching,
  listCompareEmptyDiffTeachings,
  type CompareEmptyDiffReasonId,
} from "@/lib/compare-empty-diff-teaching";

const ENGINEERING_JARGON = /\b(endpoint|row-level|API)\b/i;

describe("buildCompareEmptyDiffTeaching", () => {
  it.each(COMPARE_EMPTY_DIFF_REASON_IDS)(
    "returns buyer nouns for reason %s",
    (reasonId: CompareEmptyDiffReasonId) => {
      const teaching = buildCompareEmptyDiffTeaching(reasonId);

      expect(teaching.reasonId).toBe(reasonId);
      expect(teaching.title.length).toBeGreaterThan(0);
      expect(teaching.body.length).toBeGreaterThan(0);
      expect(teaching.nextSteps.length).toBeGreaterThan(0);
      expect(teaching.title).not.toMatch(ENGINEERING_JARGON);
      expect(teaching.body).not.toMatch(ENGINEERING_JARGON);

      for (const step of teaching.nextSteps) {
        expect(step).not.toMatch(ENGINEERING_JARGON);
      }
    },
  );

  it("explains no-run-level-diffs with package-level sameness", () => {
    const teaching = buildCompareEmptyDiffTeaching("no-run-level-diffs");

    expect(teaching.title).toMatch(/architecture packages/i);
    expect(teaching.body).toMatch(/findings/i);
    expect(teaching.body).toMatch(/decisions/i);
    expect(teaching.body).toMatch(/evidence/i);
    expect(teaching.nextSteps.some((step) => /baseline/i.test(step))).toBe(true);
  });

  it("explains missing-comparison-block without implying zero diffs inside a block", () => {
    const teaching = buildCompareEmptyDiffTeaching("missing-comparison-block");

    expect(teaching.title).toMatch(/unavailable/i);
    expect(teaching.body).toMatch(/did not include/i);
  });

  it("explains empty-manifest-diffs as present comparison with no material change", () => {
    const teaching = buildCompareEmptyDiffTeaching("empty-manifest-diffs");

    expect(teaching.title).toMatch(/no changes/i);
    expect(teaching.body).toMatch(/comparison was produced/i);
  });
});

describe("listCompareEmptyDiffTeachings", () => {
  it("returns one row per reason id in stable order", () => {
    const rows = listCompareEmptyDiffTeachings();

    expect(rows.map((row) => row.reasonId)).toEqual([...COMPARE_EMPTY_DIFF_REASON_IDS]);
  });
});

describe("COMPARE_VERDICT_ZERO_CHANGES_TEACHING", () => {
  it("uses buyer nouns and next-step guidance", () => {
    expect(COMPARE_VERDICT_ZERO_CHANGES_TEACHING).not.toMatch(ENGINEERING_JARGON);
    expect(COMPARE_VERDICT_ZERO_CHANGES_TEACHING).toMatch(/architecture packages/i);
    expect(COMPARE_VERDICT_ZERO_CHANGES_TEACHING).toMatch(/baseline/i);
  });
});
