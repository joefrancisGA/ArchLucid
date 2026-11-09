import { SECURENOW_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { secureNowTitleCase } from "@/lib/product-line/securenow-title-case";

export const SECURENOW_PATH_INSPECT_PANEL_TITLE = secureNowTitleCase("Path inspect");

export const SECURENOW_PATH_INSPECT_PANEL_LEAD =
  "Review architect path hops, confidence band, weakest link, cut points, and advisory remediation for the selected finding." as const;

export const SECURENOW_PATH_INSPECT_EMPTY_NO_PATH = "This finding does not cite a path." as const;

export const SECURENOW_PATH_INSPECT_LOADING = "Loading path inspect…" as const;

export const SECURENOW_PATH_INSPECT_ERROR = "Path inspect unavailable" as const;

export const SECURENOW_PATH_INSPECT_WEAKEST_HOP_TITLE = secureNowTitleCase("Weakest hop");

export const SECURENOW_PATH_INSPECT_ARCHITECT_SENTENCE_TITLE = secureNowTitleCase("Architect path summary");

export const SECURENOW_PATH_INSPECT_HOPS_TITLE = secureNowTitleCase("Path hops");

export const SECURENOW_PATH_INSPECT_CUT_POINTS_TITLE = secureNowTitleCase("Cut points");

export const SECURENOW_PATH_INSPECT_CHANGE_IMPACT_DISCIPLINE =
  "A cut point is an advisory intervention. Your engineer applies the change in Azure outside SecureNow. A later successful capture can support whether the condition changed." as const;

export const SECURENOW_PATH_INSPECT_FRAMEWORK_THEME =
  "Framework theme: Microsoft cloud security benchmark. A cited theme is not a certification." as const;

export const SECURENOW_PATH_INSPECT_EXPECTATION_KEYS_LINE =
  "Assigned packs expose named expectation keys in Standards and rules. Path rank and explanation outputs are not pack-parameterized (WK-21)." as const;

export const SECURENOW_PATH_INSPECT_EXPECTATION_KEYS_HREF = SECURENOW_STANDARDS_AND_RULES_PATH;

export const SECURENOW_PATH_INSPECT_ROUTING_TITLE = secureNowTitleCase("Organizational routing");

export const SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK = "Open advisory remediation instance" as const;

export const SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT =
  "Select a priority row or ranked architect path. Path inspect shows hop evidence, weakest-hop band limits, and rank prose — not live Azure changes." as const;

export const SECURENOW_PATH_INSPECT_RANK_TITLE = secureNowTitleCase("Path rank");

export const SECURENOW_PATH_INSPECT_RANK_LOADING = "Loading path rank…" as const;

export const SECURENOW_PATH_INSPECT_RANK_UNAVAILABLE = "Path rank unavailable" as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_TITLE = secureNowTitleCase("Architect explanation");

export const SECURENOW_PATH_INSPECT_EXPLANATION_LEAD =
  "Generate a cited explanation for this path. Structured path hops remain authoritative." as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_BUTTON = "Generate explanation" as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_LOADING = "Generating explanation…" as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_ERROR = "Explanation unavailable" as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_TAG = "Simulator — not live LLM" as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_MODEL_TAG = "Model — cited stored path" as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_LEAD =
  "This uses the deterministic simulator. Structured path hops remain authoritative. This does not change the rank." as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_MODEL_LEAD =
  "This uses the live model with citations constrained to the stored path. Structured path hops remain authoritative. This does not change the rank." as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_GROUNDED_ON = "Grounded on" as const;

export const SECURENOW_PATH_INSPECT_EXPLANATION_CITATION_REJECTION_TAG =
  "Stored-path fallback — citation rejected" as const;

export const SECURENOW_PATH_RANKED_PATHS_TITLE = secureNowTitleCase("Ranked architect paths");

export const SECURENOW_PATH_RANKED_PATHS_LEAD =
  "Deterministic path ranking (SA-09). Select a row to inspect hops, cut points, and rank breakdown." as const;

export const SECURENOW_PATH_RANKED_PATHS_EMPTY =
  "No ranked path for this scope. Open collection, then select a row." as const;

export const SECURENOW_PATH_RANKED_PATHS_ERROR = "Ranked paths unavailable" as const;
