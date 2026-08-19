/**
 * TB-1482 — Static checks for empty form+rail whitespace on migrated operator surfaces.
 */

import type { OperatorEmptyFormRailWhitespaceEntry } from "@/lib/operator/operator-empty-form-rail-whitespace-inventory";

export type OperatorEmptyFormRailWhitespaceViolation = {
  readonly code: string;
  readonly message: string;
};

/** Legacy Advisory scope-rail void — replaced by `OperatorLivePreviewPinLayout` + compact empty. */
const LEGACY_ADVISORY_SCOPE_RAIL_GRID =
  /xl:grid-cols-\[minmax\(0,1\.5fr\)_minmax\(16rem,1fr\)\]/;

/** Bare `pinRail` boolean — readiness rail must follow `pinLivePreviewRail` policy (**TB-1574**). */
const BARE_LIVE_PREVIEW_PIN = /\bpinRail(?!=)/;

const REQUIRED_CHECKS: Readonly<
  Record<
    OperatorEmptyFormRailWhitespaceEntry["id"],
    readonly ((source: string) => readonly OperatorEmptyFormRailWhitespaceViolation[])[]
  >
> = {
  "recurrence-schedules": [
    (source) =>
      /data-empty-composition=\{/.test(source)
        ? []
        : [
            {
              code: "missing-empty-composition-marker",
              message: "Recurrence schedules must expose data-empty-composition on the page root.",
            },
          ],
  ],
  "advisory-schedules": [
    (source) =>
      LEGACY_ADVISORY_SCOPE_RAIL_GRID.test(source)
        ? [
            {
              code: "legacy-scope-rail-grid",
              message: "Advisory schedules must not restore the sparse xl scope-rail two-column grid.",
            },
          ]
        : [],
    (source) =>
      /EnterpriseCompactEmptyState/.test(source)
        ? []
        : [
            {
              code: "missing-compact-empty",
              message: "Advisory schedules empty list must use EnterpriseCompactEmptyState.",
            },
          ],
  ],
  "digests-schedule": [
    (source) =>
      /pinRail=\{pinLivePreviewRail\}/.test(source)
        ? []
        : [
            {
              code: "always-on-readiness-rail",
              message: "Digests schedule must pin the readiness rail only via pinLivePreviewRail.",
            },
          ],
    (source) =>
      BARE_LIVE_PREVIEW_PIN.test(source)
        ? [
            {
              code: "always-on-readiness-rail",
              message: "Digests schedule must not pass a bare pinRail prop to OperatorLivePreviewPinLayout.",
            },
          ]
        : [],
  ],
  "digests-browse": [
    (source) =>
      /data-testid="digests-browse-empty-state"/.test(source)
      && /DigestsBrowseSetupChecklist/.test(source)
      && /digests-browse-includes-disclosure/.test(source)
        ? []
        : [
            {
              code: "stacked-empty-tower",
              message:
                "Digests browse empty path must be checklist-first with includes preview behind disclosure.",
            },
          ],
  ],
  "alert-routing": [
    (source) =>
      /isEmptyComposition \? "max-w-4xl space-y-4"/.test(source)
        ? []
        : [
            {
              code: "empty-space-y-8",
              message: "Alert routing empty composition must use compact max-w-4xl space-y-4 rhythm.",
            },
          ],
  ],
  "alert-rules-rules-tab": [
    (source) =>
      /hasAlertRulesLivePreviewPinContent/.test(source)
      && /pinLivePreviewRail = shouldPinLivePreviewReadinessRail/.test(source)
        ? []
        : [
            {
              code: "always-on-readiness-rail",
              message: "Alert rules must pin preview/readiness only via pinLivePreviewRail policy.",
            },
          ],
    (source) =>
      /data-empty-intro=\{/.test(source)
        ? []
        : [
            {
              code: "missing-empty-composition-marker",
              message: "Alert rules empty intro must expose data-empty-intro on the layout root.",
            },
          ],
    (source) =>
      /EnterpriseCompactEmptyState/.test(source)
        ? []
        : [
            {
              code: "missing-compact-empty",
              message: "Alert rules empty list must use EnterpriseCompactEmptyState.",
            },
          ],
    (source) =>
      /sectionGap = pinLivePreviewRail \? "gap-8" : "gap-4"/.test(source)
        ? []
        : [
            {
              code: "empty-gap-8",
              message: "Alert rules must use gap-4 unless the live preview rail is pinned.",
            },
          ],
  ],
};

export function findOperatorEmptyFormRailWhitespaceViolations(
  source: string,
  entry: OperatorEmptyFormRailWhitespaceEntry,
): readonly OperatorEmptyFormRailWhitespaceViolation[] {
  if (!entry.migrated) {
    return [];
  }

  const checks = REQUIRED_CHECKS[entry.id] ?? [];
  const violations: OperatorEmptyFormRailWhitespaceViolation[] = [];

  for (const check of checks) {
    violations.push(...check(source));
  }

  return violations;
}
