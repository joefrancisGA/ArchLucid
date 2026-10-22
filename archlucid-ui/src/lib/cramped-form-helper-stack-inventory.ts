/**
 * TB-2004 — Follow-up inventory for cramped form/helper stacks after Start review primitives.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § Operator form and helper breathing room (**TB-2000**).
 */

export type CrampedFormHelperDisposition = "applied" | "deferred";

export type CrampedFormHelperStackEntry = {
  readonly id: string;
  readonly surface: string;
  readonly componentOrModule: string;
  readonly disposition: CrampedFormHelperDisposition;
  readonly notes: string;
};

export const CRAMPED_FORM_HELPER_STACK_INVENTORY: readonly CrampedFormHelperStackEntry[] = [
  {
    id: "alert-rules-create",
    surface: "/governance/alert-rules (create form)",
    componentOrModule: "components/alerts/AlertRulesContent.tsx",
    disposition: "applied",
    notes: "TB-2004 apply — OPERATOR_FORM_FIELD_STACK_CLASS on create fields; do not reopen TB-1479 voids.",
  },
  {
    id: "policy-pack-nl-builder",
    surface: "/governance/policy-packs (NL builder)",
    componentOrModule: "app/(operator)/governance/policy-packs/_sections/PolicyPackNaturalLanguageBuilder.tsx",
    disposition: "deferred",
    notes: "Dense builder chrome; revisit only if multi-line helpers wrap poorly.",
  },
  {
    id: "policy-pack-visual-builder",
    surface: "/governance/policy-packs (visual builder)",
    componentOrModule: "app/(operator)/governance/policy-packs/_sections/PolicyPackVisualBuilder.tsx",
    disposition: "deferred",
    notes: "Intentionally compact leaf grids; demoted unless helper readability regresses.",
  },
  {
    id: "pilot-baseline-wizard",
    surface: "Pilot baseline overlay wizard",
    componentOrModule: "components/PilotBaselineWizard.tsx",
    disposition: "deferred",
    notes: "Milder mt-1 stacks; TB-2007 validation affordances already shipped.",
  },
  {
    id: "onboarding-title-detail",
    surface: "/onboarding checklist title/detail stacks",
    componentOrModule: "components/operator/OperatorWelcomeOnboarding.tsx",
    disposition: "deferred",
    notes: "space-y-1 chrome only; apply if instructional paragraphs wrap.",
  },
] as const;

export const CRAMPED_FORM_HELPER_APPLIED_SOURCE_ROOTS: readonly string[] =
  CRAMPED_FORM_HELPER_STACK_INVENTORY.filter((entry) => entry.disposition === "applied").map(
    (entry) => entry.componentOrModule,
  );
