import { describe, expect, it } from "vitest";

import { DRAFT_BRANCH_AUTO_COMPARE_QUERY_KEY } from "./draft-branch-auto-compare";
import {
  DRAFT_BRANCH_PARENT_RUN_QUERY_KEY,
  runDetailHrefWithParentRun,
} from "./draft-branch-compare-navigation";

describe("runDetailHrefWithParentRun", () => {
  it("appends parentRunId when a parent run is known", () => {
    expect(runDetailHrefWithParentRun("branch-run", "parent-run")).toBe(
      `/architecture/reviews/branch-run?${DRAFT_BRANCH_PARENT_RUN_QUERY_KEY}=parent-run&${DRAFT_BRANCH_AUTO_COMPARE_QUERY_KEY}=1`,
    );
  });

  it("omits query when parent run is absent", () => {
    expect(runDetailHrefWithParentRun("solo-run", null)).toBe("/architecture/reviews/solo-run");
  });
});
