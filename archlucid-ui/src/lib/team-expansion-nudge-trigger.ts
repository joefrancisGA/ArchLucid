/** Threshold triggers for the paid Team expansion nudge (Improvement #5). */
export type TeamExpansionNudgeTrigger = "seats";

export type TeamExpansionNudgeStatusPayload = {
  isTrial?: boolean;
  commercialTier?: string | null;
  seatsUsed?: number;
  seatsLimit?: number | null;
  workspacesUsed?: number;
  workspacesLimit?: number | null;
};

const USAGE_THRESHOLD = 0.8;

export function isTeamExpansionUsageAtCap(used: number, limit: number): boolean {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) {
    return false;
  }

  return Math.trunc(used) >= Math.trunc(limit);
}

export function isTeamExpansionApproachingCap(used: number, limit: number): boolean {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) {
    return false;
  }

  const normalizedUsed = Math.trunc(used);
  const normalizedLimit = Math.trunc(limit);

  if (normalizedUsed >= normalizedLimit) {
    return false;
  }

  return normalizedUsed / normalizedLimit >= USAGE_THRESHOLD;
}

/** Returns the active seats trigger, or null when no nudge threshold is met. Workspace caps are enforced at create time, not shell nudges. */
export function resolveTeamExpansionNudgeTrigger(
  payload: TeamExpansionNudgeStatusPayload | null,
): TeamExpansionNudgeTrigger | null {
  if (payload === null || payload.isTrial === true) {
    return null;
  }

  if (payload.commercialTier !== "Team") {
    return null;
  }

  const seatsLimit = payload.seatsLimit;

  if (typeof seatsLimit === "number" && seatsLimit > 0) {
    const seatsUsed = payload.seatsUsed ?? 0;

    if (isTeamExpansionApproachingCap(seatsUsed, seatsLimit)) {
      return "seats";
    }
  }

  return null;
}

export type TeamExpansionNudgeCopy = {
  readonly title: string;
  readonly detail: string;
  readonly ctaLabel: string;
};

export function buildTeamExpansionNudgeCopy(
  trigger: TeamExpansionNudgeTrigger,
  payload: TeamExpansionNudgeStatusPayload,
): TeamExpansionNudgeCopy {
  if (trigger !== "seats") {
    const _exhaustive: never = trigger;
    return _exhaustive;
  }

  const used = payload.seatsUsed ?? 0;
  const limit = payload.seatsLimit;

  return {
    title: "You're approaching your Team seat limit",
    detail:
      typeof limit === "number"
        ? `${used} of ${limit} seats in use — request a quote to expand to Professional.`
        : `${used} seats in use — request a quote to expand to Professional.`,
    ctaLabel: "Request a quote",
  };
}

export function buildTeamExpansionNudgePricingHref(trigger: TeamExpansionNudgeTrigger): string {
  return `/pricing?source=team-expansion&trigger=${encodeURIComponent(trigger)}#pricing-quote-request`;
}