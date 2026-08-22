/** Marketing and demo routes reachable from the architect shell. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

export const MARKETING_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/why-archlucid",
    entry: {
      whatIsThisPage:
        "Why ArchLucid — internal demo/proof page with seeded telemetry, sponsor pack, and first-value report for the demo review.",
      whatToDoNext:
        "Inspect snapshot and sponsor pack sections, open marketing /why for buyer comparison, or Assurance status for assurance orientation.",
      whyEmpty: "Sections populate after the demo tenant snapshot and related read endpoints load.",
      whereToConfigurePrerequisite:
        "A seeded demo review is required; Claims/Retail labels stay withheld until the demo identity is unambiguous.",
      taskSteps: [
        "Inspect snapshot and sponsor pack sections.",
        "Open marketing /why for buyer comparison context.",
        "Open Assurance status when diligence orientation is needed.",
      ],
    },
  },
  {
    prefix: "/demo/explain",
    entry: {
      whatIsThisPage:
        "Demo explain — example provenance graph and citations-bound explanation for a seeded architecture review.",
      whatToDoNext:
        "Inspect the provenance and explanation panels, then start a real review or open Validate review for live packages.",
      whyEmpty: "Panels appear after the demo explain API returns a seeded review payload.",
      whereToConfigurePrerequisite:
        "A seeded demo tenant review is required; this route stays hidden from buyer nav when demo explain is unavailable.",
      taskSteps: [
        "Inspect provenance and explanation panels.",
        "Start a real review when you leave the demo path.",
        "Open Validate review for live package trails.",
      ],
    },
  },
];
