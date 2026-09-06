export const ARCHITECTURE_SEAL_DELTA_PANEL_TITLE = "Changes since last seal" as const;

export const ARCHITECTURE_SEAL_DELTA_COMPARE_LABEL = "Open compare" as const;

export const ARCHITECTURE_SEAL_DELTA_WHAT_IF_LABEL = "Run what-if" as const;

export const ARCHITECTURE_SEAL_DELTA_LOADING_LABEL = "Loading changes since last seal…" as const;

export const ARCHITECTURE_SEAL_DELTA_ERROR_LABEL = "Could not load changes since last seal." as const;

export const ARCHITECTURE_SEAL_DELTA_RETRY_LABEL = "Retry" as const;

export const ARCHITECTURE_SEAL_DELTA_DIFF_COUNT_LABEL = (count: number): string =>
  count === 1 ? "1 change" : `${count} changes`;

export const architectureSealDeltaSectionLabel = (section: string): string => {
  switch (section) {
    case "Assumptions":
      return "Assumptions";
    case "Asserted":
      return "Asserted intake";
    case "Inferred":
      return "Inferred intake";
    default:
      return section;
  }
};

export const architectureSealDeltaDiffKindLabel = (diffKind: string): string => {
  switch (diffKind) {
    case "Added":
      return "Added in draft";
    case "Removed":
      return "Removed from seal";
    case "Changed":
      return "Changed";
    default:
      return diffKind;
  }
};
