import { describe, expect, it } from "vitest";

import {
  pathInspectDetailLoadErrorRecovery,
  pathInspectRankLoadErrorRecovery,
} from "@/lib/product-line/securenow-path-inspect-error-recovery";
import { SECURENOW_PATH_INSPECT_RETRY_NO_AZURE_CHANGE } from "@/lib/product-line/securenow-path-inspect-copy";

describe("securenow path inspect error recovery", () => {
  it("shares retry discipline for detail and rank loads", () => {
    expect(pathInspectDetailLoadErrorRecovery().nextStep).toBe(SECURENOW_PATH_INSPECT_RETRY_NO_AZURE_CHANGE);
    expect(pathInspectRankLoadErrorRecovery().nextStep).toBe(SECURENOW_PATH_INSPECT_RETRY_NO_AZURE_CHANGE);
  });

  it("distinguishes rank failure from detail failure", () => {
    expect(pathInspectRankLoadErrorRecovery().whatFailed).toContain("rank");
    expect(pathInspectDetailLoadErrorRecovery().whatFailed).toContain("inspect");
  });
});