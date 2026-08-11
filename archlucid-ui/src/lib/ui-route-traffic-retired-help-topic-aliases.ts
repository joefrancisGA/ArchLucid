import { AZURE_BOARDS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-azure-boards-help";
import { CONNECT_AWS_SECURELY_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-connect-aws-securely-help";
import { CONNECT_AZURE_SECURELY_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-connect-azure-securely-help";
import { CONNECT_GCP_SECURELY_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-connect-gcp-securely-help";
import { DATA_HANDLING_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-data-handling-help";
import { EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-executive-summary-help";
import { FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-first-architecture-review-help";
import { GETTING_STARTED_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-getting-started-help";
import { GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-governance-api-contracts-help";
import { PATH_CHOOSER_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-path-chooser-help";
import { PILOT_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-pilot-guide-help";
import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";

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
    canonicalPath: FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH,
    historicalNote:
      "Deprecated core-pilot help alias (Help alias) - slug alias core-pilot -> first-architecture-review; canon COR = /help/first-architecture-review.",
  },
  {
    removedRowId: "HEV",
    retiredPath: "/help/evidence-only-review",
    canonicalPath: FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "FIR",
    retiredPath: "/help/first-pilot-path",
    canonicalPath: FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "HFE",
    retiredPath: "/help/first-hour-operator-path",
    canonicalPath: FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "HET",
    retiredPath: "/help/starting-reviews",
    canonicalPath: REVIEW_GUIDE_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "HER",
    retiredPath: "/help/creating-runs",
    canonicalPath: REVIEW_GUIDE_HELP_TRAFFIC_PATH,
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
    canonicalPath: PATH_CHOOSER_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "HEP",
    retiredPath: "/help/api-contracts",
    canonicalPath: GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "HDA",
    retiredPath: "/help/data-handling-tenant-isolation",
    canonicalPath: DATA_HANDLING_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "HAZ",
    retiredPath: "/help/integrations/azure-boards",
    canonicalPath: AZURE_BOARDS_HELP_TRAFFIC_PATH,
    buyerSurfaceGuards: [
      "src/lib/azure-boards-help-evidence-copy.ts",
      "src/lib/help-search-panel-catalog.ts",
      "src/lib/configuration-reference-help-guide-content.ts",
    ],
  },
  {
    removedRowId: "HHX",
    retiredPath: "/help/how-it-works",
    canonicalPath: GETTING_STARTED_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "EPR",
    retiredPath: "/help/product-overview",
    canonicalPath: EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH,
  },
  {
    removedRowId: "PIL",
    retiredPath: "/help/pilot-nav-profile",
    canonicalPath: PILOT_GUIDE_HELP_TRAFFIC_PATH,
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
    canonicalPath: CONNECT_AZURE_SECURELY_HELP_TRAFFIC_PATH,
  },
  {
    retiredPath: "/help/cloud-connections-aws",
    canonicalPath: CONNECT_AWS_SECURELY_HELP_TRAFFIC_PATH,
  },
  {
    retiredPath: "/help/cloud-connections-gcp",
    canonicalPath: CONNECT_GCP_SECURELY_HELP_TRAFFIC_PATH,
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
