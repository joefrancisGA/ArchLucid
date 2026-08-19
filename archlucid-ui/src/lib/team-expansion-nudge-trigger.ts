/** Threshold triggers for the paid Team expansion nudge (Improvement #5). */
export type TeamExpansionNudgeTrigger = "seats" | "workspaces";

export type TeamExpansionNudgeStatusPayload = {
  isTrial?: boolean;
  commercialTier?: string | null;
  seatsUsed?: number;
  seatsLimit?: number | null;
  workspacesUsed?: number;
  workspacesLimit?: number | null;
};

const USAGE_THRESHOLD = 0.8;

/** Returns the highest-priority active trigger, or null when no nudge threshold is met. */
export function resolveTeamExpansionNudgeTrigger(
  payload: TeamExpansionNudgeStatusPayload | null,
): TeamExpansionNudgeTrigger | null {
  if (payload === null || payload.isTrial === true) {
    return null;
  }

  if (payload.commercialTier !== "Team") {
    return null;
  }

  const workspacesLimit = payload.workspacesLimit;

  if (typeof workspacesLimit === "number" && workspacesLimit > 0) {
    const workspacesUsed = payload.workspacesUsed ?? 0;

    if (workspacesUsed / workspacesLimit >= USAGE_THRESHOLD) {
      return "workspaces";
    }
  }

  const seatsLimit = payload.seatsLimit;

  if (typeof seatsLimit === "number" && seatsLimit > 0) {
    const seatsUsed = payload.seatsUsed ?? 0;

    if (seatsUsed / seatsLimit >= USAGE_THRESHOLD) {
      return "seats";
    }
  }

  return null;
}

export function buildTeamExpansionNudgePricingHref(trigger: TeamExpansionNudgeTrigger): string {
  return `/pricing?source=team-expansion&trigger=${encodeURIComponent(trigger)}#pricing-quote-request`;
}
