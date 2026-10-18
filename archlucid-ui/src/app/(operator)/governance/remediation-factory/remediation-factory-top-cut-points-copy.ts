import { secureNowTitleCase } from "@/lib/product-line/securenow-title-case";

export const REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE = secureNowTitleCase("Highest-leverage cut points");

export const REMEDIATION_FACTORY_TOP_CUT_POINTS_LEAD =
  "These choke points collapse the most ranked paths on the current snapshot. Advisory only — nothing applies automatically." as const;

export const REMEDIATION_FACTORY_TOP_CUT_POINTS_EMPTY =
  "No cut points were computed for the current ranked paths." as const;

export const REMEDIATION_FACTORY_TOP_CUT_POINTS_LOADING = "Loading cut points…" as const;

export const REMEDIATION_FACTORY_TOP_CUT_POINTS_VIEW_PATH = "Highlight path" as const;

export const REMEDIATION_FACTORY_TOP_CUT_POINTS_PATTERN_PREFIX = "Pattern:" as const;
