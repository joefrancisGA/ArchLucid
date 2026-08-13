/** Ranked ≤~50 help routes that shared specialty chrome must address (TB-1414). */
export type SpecialtyHelpChromeBelow50InventoryEntry = {
  readonly approximateScore: number;
  readonly helpPath: string;
  readonly slug: string;
  readonly owningClusterId: string;
  readonly clusterDone: boolean;
};

export const SPECIALTY_HELP_CHROME_BELOW_50_INVENTORY: readonly SpecialtyHelpChromeBelow50InventoryEntry[] = [
  {
    approximateScore: 32,
    helpPath: "/help/developer-troubleshooting",
    slug: "developer-troubleshooting",
    owningClusterId: "TB-1246",
    clusterDone: false,
  },
  {
    approximateScore: 33,
    helpPath: "/help/api-contracts",
    slug: "api-contracts",
    owningClusterId: "TB-1384",
    clusterDone: false,
  },
  {
    approximateScore: 39,
    helpPath: "/help/configuration-reference",
    slug: "configuration-reference",
    owningClusterId: "TB-1326",
    clusterDone: false,
  },
  {
    approximateScore: 40,
    helpPath: "/help/repeat-review-loop",
    slug: "repeat-review-loop",
    owningClusterId: "TB-1394",
    clusterDone: true,
  },
  {
    approximateScore: 42,
    helpPath: "/help/evaluator-workbook",
    slug: "evaluator-workbook",
    owningClusterId: "TB-1345",
    clusterDone: false,
  },
  {
    approximateScore: 42,
    helpPath: "/help/executive-summary",
    slug: "executive-summary",
    owningClusterId: "TB-1389",
    clusterDone: true,
  },
  {
    approximateScore: 46,
    helpPath: "/help/first-hour-operator-path",
    slug: "first-hour-operator-path",
    owningClusterId: "TB-1374",
    clusterDone: false,
  },
  {
    approximateScore: 49,
    helpPath: "/help/procurement",
    slug: "procurement",
    owningClusterId: "TB-1253",
    clusterDone: false,
  },
] as const;

export const SPECIALTY_HELP_CHROME_EXEMPLAR_COMPONENTS: readonly string[] = [
  "HelpCorePilotGuideView",
  "HelpConnectAzureSecurelyGuideView",
  "HelpReviewPackagesGuideView",
  "HelpRepeatReviewLoopGuideView",
] as const;

export const SPECIALTY_HELP_CHROME_CONTRACT_PATH =
  "docs/library/SPECIALTY_HELP_CHROME_CONTRACT.md" as const;

export const SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX = 3;
