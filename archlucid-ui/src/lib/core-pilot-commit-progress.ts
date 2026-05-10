import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";

/** High-level Core Pilot position derived from commit-context signals (matches {@link CORE_PILOT_STEPS} pacing). */
export type CorePilotCommitProgressState = "no-run" | "has-run" | "committed";

export function deriveCorePilotCommitProgressState(
  hasCommittedManifest: boolean,
  latestRunId: string | null,
): CorePilotCommitProgressState {
  if (hasCommittedManifest) {
    return "committed";
  }

  if (latestRunId !== null) {
    return "has-run";
  }

  return "no-run";
}

/** Badge label shown in Core Pilot UI ("Step N of 4"). */
export function corePilotStepBadgeLabel(state: CorePilotCommitProgressState): string {
  switch (state) {
    case "committed":
      return "Step 4 of 4";
    case "has-run":
      return "Step 2–3 of 4";
    case "no-run":
      return "Step 1 of 4";
  }
}

export function corePilotCommitProgressFromContext(ctx: CorePilotCommitContext): CorePilotCommitProgressState {
  return deriveCorePilotCommitProgressState(ctx.hasCommittedManifest, ctx.latestRunId);
}
