import type { PageHelpDrawerSupplement } from "@/lib/help/page-help-drawer-supplement-types";

/** Lightweight key-point previews — keep copy short; full help pages remain authoritative. */
export const PAGE_HELP_DRAWER_KEY_POINTS_BY_SLUG: Readonly<Record<string, readonly string[]>> = {
  digests: [
    "Schedule tab — sponsor rollup cadence and recipients.",
    "Subscriptions tab — architecture digest destinations.",
    "Browse tab — generated digest history and previews.",
  ],
  findings: [
    "Title — short statement of the architecture concern.",
    "Severity — urgency or materiality for the review.",
    "Evidence — inputs, diagrams, or policy checks behind the finding.",
    "Recommendation — suggested remediation or next step.",
  ],
  "improvement-planning": [
    "Themes — recurring feedback patterns in the current scope.",
    "Plans — prioritized follow-up work grouped from themes.",
    "Exports — shareable summaries for stakeholders and triage.",
  ],
  "evidence-graph": [
    "Pick a completed review to load its relationship graph.",
    "Trace how evidence supports findings and approval decisions.",
    "Highlight a path when you need to explain a specific chain.",
  ],
  "comparison-replay": [
    "Compare two reviews when you need a delta narrative for sponsors.",
    "Replay a saved comparison when you need to re-export without a new review.",
  ],
};

export function pageHelpDrawerKeyPointsForSlug(slug: string): readonly string[] | undefined {
  return PAGE_HELP_DRAWER_KEY_POINTS_BY_SLUG[slug];
}
