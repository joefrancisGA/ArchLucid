import { describe, expect, it, vi } from "vitest";

import {
  ASK_WORKSPACE_ALL_REVIEWS_VALUE,
  findRunSummaryById,
  operatorAllowsSyntheticAskRunPick,
} from "@/components/ask-run-id-picker-helpers";
import type { RunSummary } from "@/types/authority";

vi.mock("@/lib/live-operator-shell-recovery", () => ({
  isLiveOperatorShellRecoveryContext: () => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

describe("ask-run-id-picker-helpers", () => {
  it("findRunSummaryById matches case-insensitively", () => {
    const items: RunSummary[] = [{ runId: "Run-ABC", description: "Demo" }];

    expect(findRunSummaryById(items, "run-abc")?.runId).toBe("Run-ABC");
  });

  it("ASK_WORKSPACE_ALL_REVIEWS_VALUE stays stable", () => {
    expect(ASK_WORKSPACE_ALL_REVIEWS_VALUE).toBe("__workspace_all__");
  });

  it("blocks synthetic sample pick for Working live desk even when buyer-polished (WA-05)", () => {
    expect(operatorAllowsSyntheticAskRunPick(true)).toBe(false);
    expect(operatorAllowsSyntheticAskRunPick(false)).toBe(true);
  });
});
