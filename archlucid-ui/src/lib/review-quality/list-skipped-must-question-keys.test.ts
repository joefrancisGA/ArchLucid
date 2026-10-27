import { describe, expect, it } from "vitest";

import {
  listSkippedMustQuestionKeys,
  SKIPPED_MUST_QUESTION_KEY_NOT_STORED_LABEL,
} from "@/lib/review-quality/list-skipped-must-question-keys";

describe("listSkippedMustQuestionKeys", () => {
  it("keeps blank question keys with an explicit not-stored label", () => {
    const keys = listSkippedMustQuestionKeys({
      skipped: [{ questionKey: "  ", tier: "Must" }],
      answered: [],
    });

    expect(keys).toEqual([SKIPPED_MUST_QUESTION_KEY_NOT_STORED_LABEL]);
  });
});
