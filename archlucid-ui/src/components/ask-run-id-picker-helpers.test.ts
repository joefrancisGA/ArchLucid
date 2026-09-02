import { describe, expect, it } from "vitest";

import {
  ASK_WORKSPACE_ALL_REVIEWS_VALUE,
  findRunSummaryById,
} from "@/components/ask-run-id-picker-helpers";
import type { RunSummary } from "@/types/authority";

describe("ask-run-id-picker-helpers", () => {
  it("findRunSummaryById matches case-insensitively", () => {
    const items: RunSummary[] = [{ runId: "Run-ABC", description: "Demo" }];

    expect(findRunSummaryById(items, "run-abc")?.runId).toBe("Run-ABC");
  });

  it("ASK_WORKSPACE_ALL_REVIEWS_VALUE stays stable", () => {
    expect(ASK_WORKSPACE_ALL_REVIEWS_VALUE).toBe("__workspace_all__");
  });
});
