import { describe, expect, it } from "vitest";

import {
  doItAgainRegistryId,
  listDoItAgainActions,
} from "@/lib/do-it-again-actions";
import { POST_COMMIT_OPTIONAL_ACTION_IDS } from "@/lib/review-lifecycle-next-action-registry";

describe("do-it-again-actions (TB-2359)", () => {
  it("maps the four-family jobs to registry ids with whenToUse copy", () => {
    const actions = listDoItAgainActions("post-finalize");

    expect(actions.map((action) => action.familyId)).toEqual([
      "start-another",
      "compare",
      "recurrence",
      "validate",
    ]);
    expect(actions.map((action) => action.registryId)).toEqual([
      "second-review",
      "compare",
      "schedule-recurrence",
      "validate-replay",
    ]);
    expect(actions.every((action) => action.whenToUse.length > 0)).toBe(true);
    expect(doItAgainRegistryId("validate")).toBe("validate-replay");
  });

  it("includes start-another during in-review but not compare or recurrence", () => {
    const actions = listDoItAgainActions("in-review");

    expect(actions.map((action) => action.familyId)).toEqual(["start-another", "validate"]);
  });

  it("keeps validate off the default post-commit optional list", () => {
    expect(POST_COMMIT_OPTIONAL_ACTION_IDS).not.toContain("validate-replay");
  });
});
