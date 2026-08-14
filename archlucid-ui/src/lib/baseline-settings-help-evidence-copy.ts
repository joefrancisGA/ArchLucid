import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { BASELINE_SETTINGS_SOURCES_INTRO } from "@/lib/baseline-settings-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const BASELINE_SETTINGS_HELP_CANONICAL_PATH = "/help/baseline-settings" as const;

export const BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how baseline anchors feed architecture scorecard and sponsor-report value estimates — open Pilot ROI measurement or ROI summary help when sponsors need methodology beyond measurement inputs.";

export const BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const BASELINE_SETTINGS_HELP_SOURCES_INTRO = BASELINE_SETTINGS_SOURCES_INTRO;

/** Help follow-ups — no self-href, no assurance status, no duplicate ROI destinations. */
export const BASELINE_SETTINGS_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Pilot ROI measurement",
    href: inAppHelpHref("sponsor-report", "pilot-roi-measurement"),
    when: "Read methodology when anchors need procurement-safe assumptions",
  },
  {
    label: "Architecture scorecard",
    href: "/insights/architecture-scorecard",
    when: "Open scorecard when portfolio framing goes beyond measurement inputs",
  },
  {
    label: "ROI summary help",
    href: inAppHelpHref("roi-summary"),
    when: "Follow savings framing when sponsors ask how anchors translate to outcomes",
  },
  {
    label: "Sponsor report",
    href: "/insights/sponsor-report",
    when: "Open value report when baseline anchors feed sponsor-facing outcomes",
  },
] as const;
