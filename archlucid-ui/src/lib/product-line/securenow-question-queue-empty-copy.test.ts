import { describe, expect, it } from "vitest";

import { SECURENOW_QUESTION_QUEUE_EMPTY_FILTER } from "./securenow-question-queue-empty-copy";

describe("SecureNow question queue empty copy", () => {
  it("names a safe next action and keeps the empty state honest", () => {
    expect(SECURENOW_QUESTION_QUEUE_EMPTY_FILTER).toBe(
      "No questions match this filter. Clear the filter, or open a diagram subscription that has a capture. An empty list is not a clean environment.",
    );
  });
});
