/**
 * TB-1574 — Live preview / readiness rail pin policy (operator side rails).
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § Operator side rails — kind
 * **Live preview / readiness** mounts as a persistent right column only when
 * draft/selection produces pin-worthy live content. Otherwise stay single-column
 * or stack the rail content below the primary column.
 */

/** Named rail kind for PR notes / inventory (**TB-1575** / **TB-1576**). */
export const OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND = "live" as const;

export type OperatorLivePreviewReadinessRailKind =
  typeof OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND;

/**
 * Returns true when the page may open the persistent right column for this kind.
 * Callers still render rail content when false — they stack it under the primary column.
 */
export function shouldPinLivePreviewReadinessRail(hasPinWorthyLiveContent: boolean): boolean {
  return hasPinWorthyLiveContent;
}

/** Alert rules Rules tab — pin when rules exist or the create draft left the empty defaults. */
export function hasAlertRulesLivePreviewPinContent(input: {
  readonly existingRuleCount: number;
  readonly draftDiffersFromDefault: boolean;
}): boolean {
  if (input.existingRuleCount > 0) {
    return true;
  }

  return input.draftDiffersFromDefault;
}

/** Digests Schedule — pin when schedule/recipients/preview digest give the readiness rail a job. */
export function hasExecDigestScheduleLivePreviewPinContent(input: {
  readonly isConfigured: boolean;
  readonly recipientCount: number;
  readonly hasPreviewDigest: boolean;
}): boolean {
  if (input.isConfigured) {
    return true;
  }

  if (input.recipientCount > 0) {
    return true;
  }

  return input.hasPreviewDigest;
}
