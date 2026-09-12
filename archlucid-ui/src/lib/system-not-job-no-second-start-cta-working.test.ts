import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveWorkingHomeNewReviewBridgeCopy,
  resolveWorkingHomeSingleStartPrimaryLabel,
  SYSTEM_NOT_JOB_NO_SECOND_START_CTA_WORKING_DOC_ANCHOR,
  SYSTEM_NOT_JOB_NO_SECOND_START_CTA_WORKING_OWNER,
  WORKING_HOME_BANNED_PEER_START_LABELS,
  WORKING_HOME_NEW_REVIEW_BRIDGE_COPY,
  WORKING_HOME_SINGLE_START_PRIMARY_LABEL,
} from "@/lib/system-not-job-no-second-start-cta-working";

const REPO_ROOT = join(process.cwd(), "..");

const WORKING_HOME_DUAL_START_GUARD_FILES = [
  "archlucid-ui/src/components/usability/PilotCommandCenterCard.tsx",
  "archlucid-ui/src/components/operator-home/OperatorHomeCompactStartingActionsSection.tsx",
  "archlucid-ui/src/components/operator-home/OperatorHomeWorkingPrimaryCta.tsx",
] as const;

describe("SN-020 Working Home has no peer start CTAs", () => {
  it("uses New review as the sole empty-state primary label", () => {
    expect(resolveWorkingHomeSingleStartPrimaryLabel()).toBe("New review");
    expect(WORKING_HOME_SINGLE_START_PRIMARY_LABEL).toBe("New review");
    expect(resolveWorkingHomeNewReviewBridgeCopy()).toBe(WORKING_HOME_NEW_REVIEW_BRIDGE_COPY);
    expect(WORKING_HOME_NEW_REVIEW_BRIDGE_COPY.toLowerCase()).not.toContain("start review");
  });

  it("bans peer start product labels on Working Home surfaces", () => {
    expect(WORKING_HOME_BANNED_PEER_START_LABELS).toContain("Create architecture");
    expect(WORKING_HOME_BANNED_PEER_START_LABELS).toContain("Start review");
  });

  it("mode-gates dual-path lifecycle cards off Working Home command center phases", () => {
    const pilotCard = readFileSync(join(REPO_ROOT, WORKING_HOME_DUAL_START_GUARD_FILES[0]), "utf8");

    expect(pilotCard).toContain("workspacePhase === \"eval-empty\" && !isWorkingMode");
    expect(pilotCard).toContain("workspacePhase === \"eval-with-drafts\" && !isWorkingMode");
    expect(pilotCard).toContain("workspacePhase === \"active-reviews\" && !isWorkingMode");
    expect(pilotCard).toContain("OperatorHomeLifecycleAlternativesDisclosure");
  });

  it("hides dual-path cards in Working compact starting actions", () => {
    const compactStarting = readFileSync(join(REPO_ROOT, WORKING_HOME_DUAL_START_GUARD_FILES[1]), "utf8");

    expect(compactStarting).toContain("hideDualPathCards = props.hasCommittedManifest === true || props.workingMode === true");
    expect(compactStarting).toContain("OperatorHomeWorkingPrimaryCta");
    expect(compactStarting).toContain("OperatorHomeDualPathCards");
  });

  it("wires Working Home primary CTA through SN-020 resolver", () => {
    const workingPrimary = readFileSync(join(REPO_ROOT, WORKING_HOME_DUAL_START_GUARD_FILES[2]), "utf8");

    expect(workingPrimary).toContain("resolveWorkingHomeSingleStartPrimaryLabel");
    expect(workingPrimary).toContain("resolveWorkingHomeNewReviewBridgeCopy");
    expect(workingPrimary).not.toContain("START_REVIEW_LABEL");
    expect(workingPrimary).not.toContain("CREATE_ARCHITECTURE_LABEL");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_NO_SECOND_START_CTA_WORKING_DOC_ANCHOR))).toBe(true);
    expect(SYSTEM_NOT_JOB_NO_SECOND_START_CTA_WORKING_OWNER).toBe("SN-020");
    expect(SYSTEM_NOT_JOB_NO_SECOND_START_CTA_WORKING_DOC_ANCHOR).toContain("0069");
  });
});
