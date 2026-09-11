import { describe, expect, it } from "vitest";

import { isLivelihoodMutationReplayReturnPath } from "@/lib/auth/livelihood-mutation-replay-return-path";

describe("livelihood-mutation-replay-return-path (LW-064)", () => {
  it("rejects marketing and auth bootstrap paths", () => {
    expect(isLivelihoodMutationReplayReturnPath("/trust")).toBe(false);
    expect(isLivelihoodMutationReplayReturnPath("/pricing")).toBe(false);
    expect(isLivelihoodMutationReplayReturnPath("/auth/signin")).toBe(false);
    expect(isLivelihoodMutationReplayReturnPath("/auth/session-expired")).toBe(false);
  });

  it("accepts operator livelihood return paths", () => {
    expect(isLivelihoodMutationReplayReturnPath("/architecture/reviews/run-1/findings/f-1")).toBe(true);
    expect(isLivelihoodMutationReplayReturnPath("/integrations/jira")).toBe(true);
  });
});
