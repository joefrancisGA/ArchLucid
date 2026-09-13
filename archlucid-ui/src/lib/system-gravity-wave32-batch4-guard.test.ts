import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveArchitectureIdentityCurrentDraftState } from "@/lib/architecture/architecture-identity-current-draft";
import {
  CHEAP_EXPLORATION_ENVELOPE_COMPLETE_NOT_READY_COPY,
} from "@/lib/cheap-exploration-envelope-not-career-complete";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import {
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
  resolveSystemNotJobCloneFromSnapshotConfirmCopy,
} from "@/lib/system-not-job-clone-from-snapshot-entry";
import {
  SYSTEM_NOT_JOB_DESK_CHILD_LIST_SURFACES,
  resolveSystemNotJobWorkingDeskCompareHref,
} from "@/lib/system-not-job-desk-children-not-peer-products";
import {
  SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING,
} from "@/lib/system-not-job-impact-preview-envelope-entry";
import {
  SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_SURFACES,
  resolveSystemNotJobDeskChildReviewHref,
} from "@/lib/system-not-job-in-flight-review-on-desk";
import {
  SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID,
  SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER,
} from "@/lib/system-not-job-palette-clone-new-version";
import {
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED,
} from "@/lib/system-not-job-what-if-cost-cap-chrome";
import { resolveSystemNotJobPaletteCloneNewVersionVisible } from "@/lib/system-not-job-palette-clone-new-version";
import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";

const REPO_ROOT = join(process.cwd(), "..");
const UI_ROOT = join(process.cwd(), "src");

/** ADR 0098 ratchets for SG-072–081 batch 4 sketch leftovers. */
describe("system-gravity wave 32 batch 4 ratchets (ADR 0098)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-in-flight-1";

  it("SG-072: desk child list surfaces exist and Compare nests under architecture on Working", () => {
    for (const row of SYSTEM_NOT_JOB_DESK_CHILD_LIST_SURFACES) {
      expect(existsSync(join(REPO_ROOT, row.relativePath)), row.relativePath).toBe(true);
    }

    expect(
      resolveSystemNotJobWorkingDeskCompareHref({
        architectureId,
        priorRunId: "review-1",
        laterRunId: "review-2",
        workingMode: true,
      }),
    ).toContain(`/architecture/architectures/${architectureId}/compare`);
  });

  it("SG-073: spawn-lock clone CTA uses Sketch a change test id on desk surfaces", () => {
    expect(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL).toBe("Sketch a change");
    expect(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID).toBe(
      "architecture-spawn-lock-clone-snapshot",
    );

    const cloneControlSource = readFileSync(
      join(UI_ROOT, "components/architecture/ArchitectureDraftCloneSnapshotControl.tsx"),
      "utf8",
    );
    const handoffSource = readFileSync(
      join(UI_ROOT, "components/architecture/ArchitectureDraftHandoffPanel.tsx"),
      "utf8",
    );

    expect(cloneControlSource).toContain("SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID");
    expect(handoffSource).toContain("ArchitectureDraftCloneSnapshotControl");
    expect(handoffSource).toContain("spawnLockedDeskAction");
  });

  it("SG-074: what-if cost-cap chrome distinguishes branch cap from shell budget pill", () => {
    expect(SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL).toMatch(/what-if branches/i);
    expect(SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL).toMatch(/not the shell AI budget pill/i);
    expect(SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED).toMatch(/Branch cap reached/i);

    const confirmDialogSource = readFileSync(
      join(UI_ROOT, "components/architecture/ArchitectureDraftCloneSnapshotConfirmDialog.tsx"),
      "utf8",
    );

    expect(confirmDialogSource).toContain("resolveDraftBranchWhatIfCostCapChrome");
  });

  it("SG-075: impact preview help distinguishes policy envelope from architecture sketch", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW).toMatch(
      new RegExp(SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING, "i"),
    );
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW).toMatch(/Sketch a change/i);
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW).toMatch(
      /Neither path is draft-to-draft Compare/i,
    );
  });

  it("SG-076: Sketch a change stays on desk modules, not reviews hub", () => {
    const reviewsHubSource = readFileSync(
      join(UI_ROOT, "app/(operator)/architecture/reviews/_sections/reviews-hub-package-display.ts"),
      "utf8",
    );
    const deskSource = readFileSync(
      join(UI_ROOT, "components/architecture/ArchitectureIdentityDeskCurrentDraft.tsx"),
      "utf8",
    );

    expect(reviewsHubSource).not.toContain("ArchitectureDraftCloneSnapshotControl");
    expect(deskSource).toContain("ArchitectureDraftCloneSnapshotControl");
    expect(deskSource).toContain("spawnLockedDeskAction");
  });

  it("SG-077: in-flight child review links use Activity on nested desk, not reviews hub home", () => {
    for (const relativePath of SYSTEM_NOT_JOB_IN_FLIGHT_REVIEW_ON_DESK_SURFACES) {
      expect(existsSync(join(REPO_ROOT, relativePath)), relativePath).toBe(true);
    }

    const operation: TrackedInFlightOperation = {
      operationId: `run:${runId}`,
      title: "Architecture review analysis",
      href: `/architecture/architectures/${architectureId}/reviews/${runId}?reviewTab=activity`,
      startedAtMs: 1_700_000_000_000,
      stepLabel: "Agents running",
      state: "Running",
      runId,
      architectureId,
      retainUntilConsumed: false,
      terminalToastShown: false,
    };

    expect(
      resolveSystemNotJobDeskChildReviewHref({
        runId,
        architectureId,
        inFlightOperation: operation,
      }),
    ).toContain("reviewTab=activity");
    expect(
      resolveSystemNotJobDeskChildReviewHref({
        runId,
        architectureId,
        inFlightOperation: operation,
      }),
    ).not.toBe("/architecture/reviews");
  });

  it("SG-078: clone confirm copy says parent snapshot stays sealed", () => {
    const copy = resolveSystemNotJobCloneFromSnapshotConfirmCopy({ effectiveDoor: "rehearsal" });

    expect(copy.description).toMatch(/parent snapshot/i);
    expect(copy.description).toMatch(/stay sealed|stays sealed/i);

    const csharpGuardPath =
      "ArchLucid.Application/Drafts/DraftSnapshotCloneSealedManifestHashGuard.cs";

    expect(existsSync(join(REPO_ROOT, csharpGuardPath)), csharpGuardPath).toBe(true);
  });

  it("SG-079: empty desk without spawn-locked draft has no clone source", () => {
    const state = resolveArchitectureIdentityCurrentDraftState([], null, null);

    expect(state).toEqual({ kind: "none", cloneSourceDraftId: null });
  });

  it("SG-081: palette clone action is Sketch a change and hidden without spawn-lock DOM", () => {
    expect(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID).toBe("action-clone-from-snapshot");
    expect(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER.label).toBe("Sketch a change");
    expect(
      resolveSystemNotJobPaletteCloneNewVersionVisible("/architecture/architectures/arch-1"),
    ).toBe(false);

    const handlerSource = readFileSync(
      join(UI_ROOT, "lib/command-palette-handler-actions.ts"),
      "utf8",
    );

    expect(handlerSource).toContain("action-clone-from-snapshot");
    expect(handlerSource).not.toMatch(/Edit draft anyway/i);
  });

  it("SG-071 cross-ref: envelope complete honesty copy stays separate from Career seal", () => {
    expect(CHEAP_EXPLORATION_ENVELOPE_COMPLETE_NOT_READY_COPY).toMatch(/Career seal/i);
    expect(CHEAP_EXPLORATION_ENVELOPE_COMPLETE_NOT_READY_COPY).toMatch(/Record review/i);
  });
});
