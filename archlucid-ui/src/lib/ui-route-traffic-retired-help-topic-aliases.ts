import { AZURE_BOARDS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-azure-boards-help";
import { DATA_HANDLING_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-data-handling-help";
import { EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-executive-summary-help";
import { FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-first-architecture-review-help";
import { GETTING_STARTED_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-getting-started-help";
import { GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-governance-api-contracts-help";
import { PATH_CHOOSER_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-path-chooser-help";
import { PILOT_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-pilot-guide-help";
import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";

export type RetiredHelpTopicAliasTrafficEntry = {
  removedRowId: string;
  retiredPath: string;
  canonicalPath: string;
  historicalNote?: string;
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
] as const;

export const REMOVED_CORE_PILOT_HELP_ALIAS_TRAFFIC_ROW_ID = "ECO";
export const RETIRED_CORE_PILOT_HELP_ALIAS_TRAFFIC_PATH = "/help/core-pilot";
export const CANONICAL_FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH =
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH;

export const REMOVED_EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_ROW_ID = "HEV";
export const RETIRED_EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_PATH = "/help/evidence-only-review";
export const CANONICAL_FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH_FROM_EVIDENCE_ONLY =
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH;

export const REMOVED_FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_ROW_ID = "FIR";
export const RETIRED_FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_PATH = "/help/first-pilot-path";
export const CANONICAL_FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH_FROM_FIRST_PILOT_PATH =
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH;

export const REMOVED_FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_ROW_ID = "HFE";
export const RETIRED_FIRST_HOUR_OPERATOR_PATH_HELP_ALIAS_TRAFFIC_PATH = "/help/first-hour-operator-path";

export const REMOVED_STARTING_REVIEWS_HELP_ALIAS_TRAFFIC_ROW_ID = "HET";
export const RETIRED_STARTING_REVIEWS_HELP_ALIAS_TRAFFIC_PATH = "/help/starting-reviews";
export const CANONICAL_REVIEW_GUIDE_HELP_TRAFFIC_PATH_FROM_STARTING_REVIEWS = REVIEW_GUIDE_HELP_TRAFFIC_PATH;

export const REMOVED_CREATING_RUNS_HELP_ALIAS_TRAFFIC_ROW_ID = "HER";
export const RETIRED_CREATING_RUNS_HELP_ALIAS_TRAFFIC_PATH = "/help/creating-runs";
export const CANONICAL_REVIEW_GUIDE_HELP_TRAFFIC_PATH = REVIEW_GUIDE_HELP_TRAFFIC_PATH;

export const REMOVED_EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_ROW_ID = "HEE";
export const RETIRED_EVALUATOR_WORKBOOK_HELP_ALIAS_TRAFFIC_PATH = "/help/evaluator-workbook";
export const CANONICAL_PATH_CHOOSER_HELP_TRAFFIC_PATH = PATH_CHOOSER_HELP_TRAFFIC_PATH;

export const REMOVED_API_CONTRACTS_HELP_ALIAS_TRAFFIC_ROW_ID = "HEP";
export const RETIRED_API_CONTRACTS_HELP_ALIAS_TRAFFIC_PATH = "/help/api-contracts";
export const CANONICAL_GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH =
  GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH;

export const REMOVED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_ROW_ID = "HDA";
export const RETIRED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_PATH =
  "/help/data-handling-tenant-isolation";

export const REMOVED_AZURE_BOARDS_HELP_ALIAS_TRAFFIC_ROW_ID = "HAZ";
export const RETIRED_AZURE_BOARDS_HELP_ALIAS_TRAFFIC_PATH = "/help/integrations/azure-boards";
export const CANONICAL_AZURE_BOARDS_HELP_TRAFFIC_PATH = AZURE_BOARDS_HELP_TRAFFIC_PATH;

export const REMOVED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_ROW_ID = "HHX";
export const RETIRED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_PATH = "/help/how-it-works";
export const CANONICAL_GETTING_STARTED_HELP_TRAFFIC_PATH_FROM_HOW_IT_WORKS = GETTING_STARTED_HELP_TRAFFIC_PATH;

export const REMOVED_PRODUCT_OVERVIEW_HELP_ALIAS_TRAFFIC_ROW_ID = "EPR";
export const RETIRED_PRODUCT_OVERVIEW_HELP_ALIAS_TRAFFIC_PATH = "/help/product-overview";
export const CANONICAL_EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH_FROM_PRODUCT_OVERVIEW =
  EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH;

export const REMOVED_PILOT_NAV_PROFILE_HELP_ALIAS_TRAFFIC_ROW_ID = "PIL";
export const RETIRED_PILOT_NAV_PROFILE_HELP_ALIAS_TRAFFIC_PATH = "/help/pilot-nav-profile";
export const CANONICAL_PILOT_GUIDE_HELP_TRAFFIC_PATH_FROM_PILOT_NAV_PROFILE = PILOT_GUIDE_HELP_TRAFFIC_PATH;
