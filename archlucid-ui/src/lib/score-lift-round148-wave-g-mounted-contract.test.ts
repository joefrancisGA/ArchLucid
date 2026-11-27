import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round148 wave G mounted contract", () => {
  it("pipes decision velocity and open-gate stickiness into workspace chrome", () => {
    const chrome = readUiSource(
      "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.tsx",
    );
    expect(chrome).toContain("ReviewWorkspaceDecisionVelocityNextStrip");
    expect(chrome).toContain("ReviewWorkspaceOpenGateReturnStrip");
    expect(chrome).toContain("blockingApprovalCount={");

    const shell = readUiSource(
      "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageViewShell.tsx",
    );
    expect(shell).toContain("blockingApprovalCount={blockingApprovalCount}");
  });
});
