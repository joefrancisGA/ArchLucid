/**
 * TB-1664 — Cross-route nav and in-panel mode surfaces that must not fake tab ARIA.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator line tabs — visual contract* (**TB-1661**).
 * Cross-route switchers use `<nav>` + `aria-current="page"`; same-page modes use segmented `aria-pressed`.
 */

export type OperatorFakeTabAriaSurfaceEntry = {
  readonly id: string;
  readonly modulePath: string;
  readonly pattern: "cross-route-nav" | "segmented-mode";
  readonly notes: string;
};

/** Surfaces named in **TB-1664** — no `role="tab"` / `role="tablist"` on route links or custom strips. */
export const OPERATOR_FAKE_TAB_ARIA_TB1664_SURFACES: readonly OperatorFakeTabAriaSurfaceEntry[] = [
  {
    id: "value-report-outcomes-nav",
    modulePath: "components/usability/ValueReportOutcomesNav.tsx",
    pattern: "cross-route-nav",
    notes: "Sponsor report hub — nav links with aria-current, Carbon line strip styling.",
  },
  {
    id: "alert-simulation-modes",
    modulePath: "components/alerts/AlertSimulationContent.tsx",
    pattern: "segmented-mode",
    notes: "Simple / composite / compare modes — OperatorSegmentedModeToolbar (aria-pressed).",
  },
];
