import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { INHABIT_FINDING_SELECTION_URL_PARAM } from "@/lib/inhabit/inhabit-finding-selection-url";
import { resolveSystemNotJobWorkingResumeReviewHref } from "@/lib/system-not-job-portfolio-resume-href";
import { resolveProductionEvalChrome } from "@/lib/production-desk-chrome";
import {
  INHABIT_FINDINGS_LIVE_RECOVERY_BODY,
  resolveInhabitFindingsLiveRecoveryActions,
} from "@/lib/inhabit/inhabit-live-recovery-contract";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit continuity guard (IH-064–068)", () => {
  it("IH-064 uses focusedFinding URL param for selection", () => {
    expect(INHABIT_FINDING_SELECTION_URL_PARAM).toBe("focusedFinding");

    const triage = readFileSync(
      join(SRC_ROOT, "components/governance/findings/use-governance-finding-triage-with-cursor.ts"),
      "utf8",
    );

    expect(triage).toContain("governanceFindingTriagePanelsHrefFromSearch");
  });

  it("IH-065 recent views collapse working review to architecture locator", () => {
    const recents = readFileSync(join(SRC_ROOT, "lib/operator/operator-recent-views.ts"), "utf8");

    expect(recents).toContain("collapseWorkingReviewRecentEntry");
    expect(recents).toContain("architectureIdentityPath");
  });

  it("IH-067 resume href prefers architecture desk on Working", () => {
    expect(
      resolveSystemNotJobWorkingResumeReviewHref({
        runId: "run-1",
        architectureId: "arch-1",
        workingMode: true,
      }),
    ).toContain("/architecture/architectures/arch-1");
  });
});

describe("inhabit dual-spine guard (IH-070–071)", () => {
  it("IH-070 keeps Guided eval chrome seats", () => {
    expect(
      resolveProductionEvalChrome({
        workspaceMode: "guided",
        staticDemoFallback: false,
        demoMarketingChrome: false,
        frictionlessTrial: false,
      }),
    ).toBe(true);
  });

  it("IH-071 live inhabited recovery omits sample packages", () => {
    expect(INHABIT_FINDINGS_LIVE_RECOVERY_BODY.toLowerCase()).not.toContain("claims intake");
    expect(resolveInhabitFindingsLiveRecoveryActions("arch-1")[0]?.href).toContain("arch-1");

    const outcome = readFileSync(
      join(SRC_ROOT, "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx"),
      "utf8",
    );

    expect(outcome).toContain("inhabited-findings-live-recovery");
  });
});
