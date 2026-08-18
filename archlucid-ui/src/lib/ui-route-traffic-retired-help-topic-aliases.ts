import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";

/**
 * Canonical help URLs come from the product documentation registry, rather than
 * traffic-workbook metadata. This keeps retired-alias routing independent of scoring rows.
 */
const RETIRED_HELP_TOPIC_CANONICAL_PATHS = {
  apiContracts: inAppHelpHref("api-contracts"),
  azureBoards: inAppHelpHref("azure-boards"),
  cloudConnectionsAws: inAppHelpHref("cloud-connections-aws"),
  cloudConnectionsAzure: inAppHelpHref("cloud-connections-azure"),
  cloudConnectionsGcp: inAppHelpHref("cloud-connections-gcp"),
  dataHandling: inAppHelpHref("data-handling"),
  SponsorReport: inAppHelpHref("sponsor-report"),
  firstArchitectureReview: inAppHelpHref("first-architecture-review"),
  gettingStarted: inAppHelpHref("getting-started"),
  pathChooser: inAppHelpHref("choose-your-next-step"),
  pilotGuide: inAppHelpHref("pilot-guide"),
  reviewGuide: inAppHelpHref("review-guide"),
} as const;

export type RetiredHelpTopicAliasTrafficEntry = {
  /** Workbook row ID removed when alias was folded (omit when alias never had its own scored row). */
  removedRowId?: string;
  retiredPath: string;
  canonicalPath: string;
  historicalNote?: string;
  /** Buyer-visible strings that must not appear after retirement (path + jargon). */
  bannedBuyerCopy?: readonly string[];
  /** Repo-relative surfaces (under `archlucid-ui/`) checked for banned copy / retired paths. */
  buyerSurfaceGuards?: readonly string[];
};

/**
 * Retired help topic bookmarks folded into canonical scored routes (TB-2050 batches + PIL→HP).
 * Do not reintroduce standalone traffic rows for these paths.
 */
export const RETIRED_HELP_TOPIC_ALIAS_TRAFFIC_ENTRIES: readonly RetiredHelpTopicAliasTrafficEntry[] = [
  {
    retiredPath: "/help/core-pilot",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
    historicalNote:
      "Deprecated core-pilot help alias (Help alias) - slug alias core-pilot -> first-architecture-review; canon COR = /help/first-architecture-review.",
    bannedBuyerCopy: ["/help/core-pilot"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/app/(operator)/help/_sections/HelpCorePilotGuideView.tsx",
    ],
  },
  {
    retiredPath: "/help/evidence-only-review",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
    bannedBuyerCopy: ["/help/evidence-only-review"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/app/(operator)/help/_sections/HelpCorePilotGuideView.tsx",
    ],
  },
  {
    removedRowId: "FIR",
    retiredPath: "/help/first-pilot-path",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
    bannedBuyerCopy: ["/help/first-pilot-path"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/app/(operator)/help/_sections/HelpCorePilotGuideView.tsx",
    ],
  },
  {
    removedRowId: "HFE",
    retiredPath: "/help/first-hour-operator-path",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
    bannedBuyerCopy: ["/help/first-hour-operator-path"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/evidence-intake-help-guide-content.ts",
    ],
  },
  {
    retiredPath: "/help/starting-reviews",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.reviewGuide,
    bannedBuyerCopy: ["/help/starting-reviews"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/app/(operator)/help/_sections/HelpReviewGuideView.tsx",
    ],
  },
  {
    retiredPath: "/help/creating-runs",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.reviewGuide,
    bannedBuyerCopy: ["/help/creating-runs", "creating runs", "Creating runs"],
    buyerSurfaceGuards: [
      "src/app/(operator)/help/_sections/HelpReviewGuideView.tsx",
      "src/lib/empty-state-presets.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/bulk-evidence-upload-copy.ts",
      "src/lib/architecture/architecture-created-clarifications-sources.ts",
    ],
  },
  {
    retiredPath: "/help/evaluator-workbook",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.pathChooser,
    bannedBuyerCopy: ["/help/evaluator-workbook"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/path-chooser-help-guide-content.ts",
      "src/app/(operator)/help/_sections/HelpPathChooserGuideView.tsx",
    ],
  },
  {
    retiredPath: "/help/governance-api-contracts",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.apiContracts,
    bannedBuyerCopy: ["/help/governance-api-contracts"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/app/(operator)/help/_sections/HelpApiContractsGuideView.tsx",
    ],
  },
  {
    removedRowId: "HDA",
    retiredPath: "/help/data-handling-tenant-isolation",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.dataHandling,
    bannedBuyerCopy: ["/help/data-handling-tenant-isolation"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationGuideView.tsx",
    ],
  },
  {
    removedRowId: "HAZ",
    retiredPath: "/help/integrations/azure-boards",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.azureBoards,
    buyerSurfaceGuards: [
      "src/lib/azure-boards-help-evidence-copy.ts",
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/configuration-reference-help-guide-content.ts",
    ],
  },
  {
    removedRowId: "HHX",
    retiredPath: "/help/how-it-works",
    canonicalPath: `${RETIRED_HELP_TOPIC_CANONICAL_PATHS.gettingStarted}#how-archlucid-works`,
    bannedBuyerCopy: ["/help/how-it-works"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/getting-started-help-guide-content.ts",
      "src/app/(operator)/help/_sections/HelpGettingStartedGuideView.tsx",
    ],
  },
  {
    retiredPath: "/help/product-overview",
    canonicalPath: `${RETIRED_HELP_TOPIC_CANONICAL_PATHS.SponsorReport}#what-archlucid-is`,
    bannedBuyerCopy: ["/help/product-overview"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/app/(operator)/help/_sections/HelpSponsorSummaryGuideView.tsx",
    ],
  },
  {
    removedRowId: "FI",
    retiredPath: "/help/first-review",
    canonicalPath: `${RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview}#printable-first-run-evidence-checklist`,
    historicalNote:
      "Deprecated first-review help twin (Help topic) - Admin printable checklist folded into first-architecture-review specialty (COR); canon COR = /help/first-architecture-review.",
    bannedBuyerCopy: ["/help/first-review", "first-review help", "First review help"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/first-review-help-guide-content.ts",
      "src/lib/usability/page-help-topic-map.ts",
    ],
  },
  {
    retiredPath: "/help/first-value-20-minutes",
    canonicalPath: `${RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview}#first-value-in-20-minutes`,
    historicalNote:
      "Deprecated first-value-20-minutes help twin (Help topic) - Admin 20-minute runbook folded into first-architecture-review specialty (COR).",
    bannedBuyerCopy: ["/help/first-value-20-minutes", "first-value-20-minutes", "First value 20 minutes help"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/first-value-20-help-guide-content.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/components/usability/CorePilotProgressTrackerSummary.tsx",
      "src/components/usability/CorePilotProgressTrackerBanner.tsx",
    ],
  },
  {
    removedRowId: "PIL",
    retiredPath: "/help/pilot-nav-profile",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.pilotGuide,
    historicalNote:
      "Deprecated pilot-nav-profile help twin (Help topic) - workspace navigation guide folded into pilot-guide specialty (HP); canon HP = /help/pilot-guide.",
    bannedBuyerCopy: ["/help/pilot-nav-profile"],
    buyerSurfaceGuards: [
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/pilot-guide-help-evidence-copy.ts",
      "src/app/(operator)/help/_sections/HelpPilotGuideView.tsx",
    ],
  },
  {
    removedRowId: "PI",
    retiredPath: "/help/pilot-roi-model",
    canonicalPath: `${RETIRED_HELP_TOPIC_CANONICAL_PATHS.SponsorReport}#pilot-roi-measurement`,
    historicalNote:
      "Deprecated pilot-roi-model help twin (Help topic) - PILOT_ROI_MODEL alias stub folded into sponsor-report#pilot-roi-measurement (SPE); measurement body from PILOT_SUCCESS_SCORECARD.",
    bannedBuyerCopy: ["/help/pilot-roi-model", "pilot-roi-model", "Pilot ROI model help"],
    buyerSurfaceGuards: [
      "src/lib/help/help-center-catalog.ts",
      "src/lib/help/help-search-panel-catalog.ts",
      "src/lib/sponsor/sponsor-report-help-guide-content.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/roi-summary-sponsor-presentation.ts",
    ],
  },
  {
    removedRowId: "HPI",
    retiredPath: "/help/pilot-outcomes",
    canonicalPath: "/help/sponsor-report",
    historicalNote:
      "Deprecated pilot-outcomes help twin (Help topic) - folded into sponsor-report specialty (EXE); canon EXE = /help/sponsor-report.",
    bannedBuyerCopy: ["/help/pilot-outcomes"],
    buyerSurfaceGuards: [
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/product-documentation-registry.ts",
      "public/doc-index.json",
    ],
  },
  {
    retiredPath: "/help/operator-auth-roles",
    canonicalPath: USERS_AND_ROLES_HELP_CANONICAL_PATH,
    bannedBuyerCopy: ["/help/operator-auth-roles", "operator-auth-roles", "Operator auth roles"],
    buyerSurfaceGuards: [
      "src/lib/users-and-roles-help-evidence-copy.ts",
      "src/lib/configuration-reference-help-guide-content.ts",
      "src/lib/help/help-search-panel-catalog.ts",
    ],
  },
  {
    retiredPath: "/help/cloud-connections-azure",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.cloudConnectionsAzure,
  },
  {
    retiredPath: "/help/cloud-connections-aws",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.cloudConnectionsAws,
  },
  {
    retiredPath: "/help/cloud-connections-gcp",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.cloudConnectionsGcp,
  },
] as const;

export function retiredHelpTopicSlugFromPath(retiredPath: string): string {
  return retiredPath.replace(/^\/help\//, "");
}

export function retiredHelpTopicAliasHonestyGuardEntries(): readonly RetiredHelpTopicAliasTrafficEntry[] {
  return RETIRED_HELP_TOPIC_ALIAS_TRAFFIC_ENTRIES.filter(
    (entry) =>
      (entry.bannedBuyerCopy?.length ?? 0) > 0 || (entry.buyerSurfaceGuards?.length ?? 0) > 0,
  );
}
