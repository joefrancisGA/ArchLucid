/**
 * TB-1543 — Operator primary-CTA inventory for key hubs.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § Operator primary CTA (**TB-1539**).
 * Vitest dual-primary guard: **TB-1544** (extend from this inventory).
 *
 * ## TB-1544 checklist (extend Vitest allowlist from this inventory)
 * 1. Import `OPERATOR_PRIMARY_CTA_INVENTORY` / `OPERATOR_PRIMARY_CTA_PATTERNS`.
 * 2. For each `status: "verified"` row, render the component (or page fixture) and assert
 *    ≤1 `Button` with `variant="primary"` in header actions + empty first viewport.
 * 3. Fail when empty marks a View-star / Open-star link primary while Create/Start exists.
 * 4. Add a new inventory row when migrating another hub — name the pattern in PR notes.
 */

export const OPERATOR_PRIMARY_CTA_PATTERNS = [
  "header-create-reveals-panel",
  "header-create-always",
  "header-start",
  "empty-footer-create",
] as const;

export type OperatorPrimaryCtaPattern = (typeof OPERATOR_PRIMARY_CTA_PATTERNS)[number];

export type OperatorPrimaryCtaInventoryStatus = "verified" | "coordinate";

export type OperatorPrimaryCtaInventoryEntry = {
  readonly id: string;
  readonly pathOrSurface: string;
  readonly pattern: OperatorPrimaryCtaPattern;
  readonly primaryTestId: string;
  readonly componentOrModule: string;
  readonly status: OperatorPrimaryCtaInventoryStatus;
  readonly notes: string;
};

/**
 * Key operator hubs — checked in for agents and **TB-1544** allowlist extension.
 */
export const OPERATOR_PRIMARY_CTA_INVENTORY: readonly OperatorPrimaryCtaInventoryEntry[] = [
  {
    id: "digests-browse",
    pathOrSurface: "/architecture/digests?tab=get-started",
    pattern: "header-create-always",
    primaryTestId: "digests-primary-action",
    componentOrModule: "components/digests/DigestsHubClient.tsx",
    status: "verified",
    notes: "Create subscription stays sole header primary on browse tab.",
  },
  {
    id: "recurrence-schedules",
    pathOrSurface: "/governance/recurrence",
    pattern: "empty-footer-create",
    primaryTestId: "recurrence-schedules-create-action",
    componentOrModule: "components/governance/RecurrenceSchedulesClient.tsx",
    status: "verified",
    notes: "Empty: primary Create in Compact footer; populated: header Create (**TB-1540**).",
  },
  {
    id: "reviews-hub",
    pathOrSurface: "/architecture/reviews",
    pattern: "header-start",
    primaryTestId: "runs-page-start-review",
    componentOrModule: "app/(operator)/architecture/reviews/_sections/ReviewsHubHeaderActions.tsx",
    status: "verified",
    notes: "Single Start/Continue in header; empty Compact demotes body Start (**TB-1541** / **TB-1553**).",
  },
  {
    id: "advisory-schedules",
    pathOrSurface: "/governance/advisory-scans?tab=schedules",
    pattern: "header-create-reveals-panel",
    primaryTestId: "advisory-schedules-create-action",
    componentOrModule: "components/advisory/AdvisorySchedulesContent.tsx",
    status: "verified",
    notes: "Empty-first Compact + header Create reveals form (**TB-1542**).",
  },
  {
    id: "advisory-scans-empty",
    pathOrSurface: "/governance/advisory-scans?tab=scans",
    pattern: "header-create-reveals-panel",
    primaryTestId: "advisory-generate-scan-button",
    componentOrModule: "components/advisory/AdvisoryScansContent.tsx",
    status: "verified",
    notes: "Generate scan is the sole filled primary once a review is selected; empty footer actions stay outline (**TB-1567** / **TB-1569**).",
  },
  {
    id: "alert-rules-rules-tab",
    pathOrSurface: "/governance/alert-rules?tab=rules",
    pattern: "header-create-reveals-panel",
    primaryTestId: "alert-rules-create-action",
    componentOrModule: "components/alerts/AlertRulesContent.tsx",
    status: "verified",
    notes: "Empty: header Create reveals form; populated: form submit primary; live rail **TB-1574** / empty-first **TB-1479** / primary sm **TB-1586**.",
  },
  {
    id: "alert-routing",
    pathOrSurface: "/governance/alert-rules?tab=routing",
    pattern: "header-create-reveals-panel",
    primaryTestId: "alert-routing-create-destination",
    componentOrModule: "components/alerts/AlertRoutingContent.tsx",
    status: "verified",
    notes: "Create destination primary; empty uses Compact + header Create pattern.",
  },
  {
    id: "architectures-list",
    pathOrSurface: "/architecture/architectures",
    pattern: "header-create-always",
    primaryTestId: "architectures-page-create",
    componentOrModule: "app/(operator)/architecture/architectures/_sections/ArchitecturesHubHeaderActions.tsx",
    status: "verified",
    notes:
      "Sole header Create confirmed (**TB-1446**). ADR 0067 keeps this row verified in lockstep with `reviews-hub` so neither co-equal path is audited while the other is not.",
  },
] as const;

export function listOperatorPrimaryCtaVerifiedEntries(): readonly OperatorPrimaryCtaInventoryEntry[] {
  return OPERATOR_PRIMARY_CTA_INVENTORY.filter((entry) => entry.status === "verified");
}

export function listOperatorPrimaryCtaEntriesByPattern(
  pattern: OperatorPrimaryCtaPattern,
): readonly OperatorPrimaryCtaInventoryEntry[] {
  return OPERATOR_PRIMARY_CTA_INVENTORY.filter((entry) => entry.pattern === pattern);
}
