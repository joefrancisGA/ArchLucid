/**
 * TB-2311 — First pilot (command center / next-best-action) ≠ Operate nav unlock.
 *
 * Why two surfaces exist:
 * - First pilot (`/` Overview command center) steers the next best action for
 *   starting and finalizing a first architecture review.
 * - Operate unlock (`#operate-features-unlock-panel`) reveals Compare, evidence
 *   graph, Ask, and related analysis nav that stay hidden during the focused
 *   pilot path.
 *
 * They stay separate because pilot next-best-action is not the Operate nav
 * unlock that reveals deeper analysis routes.
 */

/** Operator home hosts the first-pilot command center. */
export const FIRST_PILOT_SURFACE_PATH = "/" as const;

/**
 * Operate unlock lives in the mobile nav panel (no dedicated page).
 * Hash targets {@link OperateFeaturesUnlockPanel} `id` for same-shell scroll.
 */
export const OPERATE_UNLOCK_PANEL_HREF = "#operate-features-unlock-panel" as const;

export type FirstPilotOperateUnlockSurfaceId = "first-pilot" | "operate-unlock";

export type FirstPilotOperateUnlockLink = {
  readonly id: FirstPilotOperateUnlockSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type FirstPilotOperateUnlockVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly firstPilotLink: FirstPilotOperateUnlockLink;
  readonly operateUnlockLink: FirstPilotOperateUnlockLink;
};

export const FIRST_PILOT_OPERATE_UNLOCK_HEADING =
  "First pilot and Operate unlock serve different purposes" as const;

export const FIRST_PILOT_OPERATE_UNLOCK_WHY_TWO =
  "The first-pilot command center steers the next best action for starting and finalizing a review. Operate unlock reveals Compare, evidence graph, Ask, and related analysis nav that stay hidden on the focused pilot path. Pilot next-best-action is not the same task as unlocking Operate analysis routes." as const;

export const FIRST_PILOT_OPERATE_UNLOCK_COMPACT_LINE =
  "First pilot steers the next review action; Operate unlock reveals Compare/graph/Ask." as const;

export const FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK: FirstPilotOperateUnlockLink = {
  id: "first-pilot",
  label: "First pilot",
  href: FIRST_PILOT_SURFACE_PATH,
  whenToUse: "Follow the Overview command center next-best-action for your first review.",
};

export const FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK: FirstPilotOperateUnlockLink = {
  id: "operate-unlock",
  label: "Operate unlock",
  href: OPERATE_UNLOCK_PANEL_HREF,
  whenToUse: "Reveal Compare, evidence graph, Ask, and related analysis tools in nav.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildFirstPilotOperateUnlockVocabulary(): FirstPilotOperateUnlockVocabularyModel {
  return {
    heading: FIRST_PILOT_OPERATE_UNLOCK_HEADING,
    whyTwo: FIRST_PILOT_OPERATE_UNLOCK_WHY_TWO,
    compactLine: FIRST_PILOT_OPERATE_UNLOCK_COMPACT_LINE,
    firstPilotLink: FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK,
    operateUnlockLink: FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveFirstPilotOperateUnlockPeerLink(
  currentSurfaceId: FirstPilotOperateUnlockSurfaceId,
): FirstPilotOperateUnlockLink {
  if (currentSurfaceId === "first-pilot") {
    return FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK;
  }

  return FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK;
}
