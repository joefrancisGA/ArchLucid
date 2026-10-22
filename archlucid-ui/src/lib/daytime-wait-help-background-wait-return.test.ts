import { describe, expect, it } from "vitest";

import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RETURN_TO_REVIEW_LABEL,
  resolveBackgroundWaitHelpReturnHref,
} from "@/lib/daytime-wait-help-background-wait-return";

describe("daytime-wait-help-background-wait-return (DW-015)", () => {
  it("accepts same-origin review detail paths", () => {
    expect(resolveBackgroundWaitHelpReturnHref("/architecture/reviews/run-42")).toBe(
      "/architecture/reviews/run-42",
    );
    expect(resolveBackgroundWaitHelpReturnHref("/architecture/reviews/run-42?tab=activity")).toBe(
      "/architecture/reviews/run-42?tab=activity",
    );
  });

  it("rejects external, hub, and malformed returnTo values", () => {
    expect(resolveBackgroundWaitHelpReturnHref(undefined)).toBeNull();
    expect(resolveBackgroundWaitHelpReturnHref("https://evil.example/reviews/run-1")).toBeNull();
    expect(resolveBackgroundWaitHelpReturnHref("//evil.example/reviews/run-1")).toBeNull();
    expect(resolveBackgroundWaitHelpReturnHref("/architecture/reviews/new")).toBeNull();
    expect(resolveBackgroundWaitHelpReturnHref("/governance/findings")).toBeNull();
  });

  it("exports the back-to-review label", () => {
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RETURN_TO_REVIEW_LABEL).toBe("Back to review");
  });
});
