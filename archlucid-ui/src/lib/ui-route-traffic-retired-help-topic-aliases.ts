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
  executiveSummary: inAppHelpHref("executive-summary"),
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
    removedRowId: "ECO",
    retiredPath: "/help/core-pilot",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
    historicalNote:
      "Deprecated core-pilot help alias (Help alias) - slug alias core-pilot -> first-architecture-review; canon COR = /help/first-architecture-review.",
  },
  {
    removedRowId: "HEV",
    retiredPath: "/help/evidence-only-review",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
  },
  {
    removedRowId: "FIR",
    retiredPath: "/help/first-pilot-path",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
  },
  {
    removedRowId: "HFE",
    retiredPath: "/help/first-hour-operator-path",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview,
  },
  {
    removedRowId: "HET",
    retiredPath: "/help/starting-reviews",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.reviewGuide,
  },
  {
    removedRowId: "HER",
    retiredPath: "/help/creating-runs",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.reviewGuide,
    bannedBuyerCopy: ["/help/creating-runs", "creating runs", "Creating runs"],
    buyerSurfaceGuards: [
      "src/app/(operator)/help/_sections/HelpReviewGuideView.tsx",
      "src/lib/empty-state-presets.ts",
      "src/lib/usability/page-help-topic-map.ts",
      "src/lib/bulk-evidence-upload-copy.ts",
      "src/lib/architecture-created-clarifications-sources.ts",
    ],
  },
  {
    removedRowId: "HEE",
    retiredPath: "/help/evaluator-workbook",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.pathChooser,
  },
  {
    removedRowId: "HEP",
    retiredPath: "/help/governance-api-contracts",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.apiContracts,
  },
  {
    removedRowId: "HDA",
    retiredPath: "/help/data-handling-tenant-isolation",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.dataHandling,
  },
  {
    removedRowId: "HAZ",
    retiredPath: "/help/integrations/azure-boards",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.azureBoards,
    buyerSurfaceGuards: [
      "src/lib/azure-boards-help-evidence-copy.ts",
      "src/lib/help-search-panel-catalog.ts",
      "src/lib/configuration-reference-help-guide-content.ts",
    ],
  },
  {
    removedRowId: "HHX",
    retiredPath: "/help/how-it-works",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.gettingStarted,
  },
  {
    removedRowId: "EPR",
    retiredPath: "/help/product-overview",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.executiveSummary,
  },
  {
    removedRowId: "FI",
    retiredPath: "/help/first-review",
    canonicalPath: `${RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview}#printable-first-run-evidence-checklist`,
    historicalNote:
      "Deprecated first-review help twin (Help topic) - Admin printable checklist folded into first-architecture-review specialty (COR); canon COR = /help/first-architecture-review.",
  },
  {
    removedRowId: "HEF",
    retiredPath: "/help/first-value-20-minutes",
    canonicalPath: `${RETIRED_HELP_TOPIC_CANONICAL_PATHS.firstArchitectureReview}#first-value-in-20-minutes`,
    historicalNote:
      "Deprecated first-value-20-minutes help twin (Help topic) - Admin 20-minute runbook folded into first-architecture-review specialty (COR).",
  },
  {
    removedRowId: "POL",
    retiredPath: "/help/policy-pack-delta-demo",
    canonicalPath: `${inAppHelpHref("policy-packs")}#policy-pack-delta-demo`,
    historicalNote:
      "Deprecated policy-pack-delta-demo help twin (Help topic) - SE demo runbook folded into policy-packs help (HEO).",
  },
  {
    removedRowId: "PIL",
    retiredPath: "/help/pilot-nav-profile",
    canonicalPath: RETIRED_HELP_TOPIC_CANONICAL_PATHS.pilotGuide,
    historicalNote:
      "Deprecated pilot-nav-profile help twin (Help topic) - workspace navigation guide folded into pilot-guide specialty (HP); canon HP = /help/pilot-guide.",
  },
  {
    retiredPath: "/help/operator-auth-roles",
    canonicalPath: USERS_AND_ROLES_HELP_CANONICAL_PATH,
    bannedBuyerCopy: ["/help/operator-auth-roles", "operator-auth-roles", "Operator auth roles"],
    buyerSurfaceGuards: [
      "src/lib/users-and-roles-help-evidence-copy.ts",
      "src/lib/configuration-reference-help-guide-content.ts",
      "src/lib/help-search-panel-catalog.ts",
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
