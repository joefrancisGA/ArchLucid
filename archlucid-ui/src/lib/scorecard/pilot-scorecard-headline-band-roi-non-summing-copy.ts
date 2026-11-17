/** Beside headline KPI bands that buyers might try to add — savings, finalized, and approval are not one total. */
export const PILOT_SCORECARD_HEADLINE_BAND_ROI_NON_SUMMING_LINE =
  "Headline bands are not additive — do not sum reviews finalized, approval counts, and savings into one ROI total." as const;

/** Operational metric grid — each tile is its own band, not a partial sum of savings or approval. */
export const PILOT_SCORECARD_OPERATIONAL_METRIC_ROI_NON_SUMMING_LINE =
  "Operational metrics are not additive with savings or approval totals — each tile stands alone." as const;

/** Beside quarterly savings estimate when shown under the annual headline. */
export const PILOT_SCORECARD_QUARTERLY_BAND_ROI_NON_SUMMING_LINE =
  "Quarterly estimate is not additive with the annual headline or other KPI tiles — do not sum bands." as const;

/** When only the annual savings headline is shown without a quarterly estimate. */
export const PILOT_SCORECARD_ANNUAL_WITHOUT_QUARTERLY_NON_SUMMING_LINE =
  "Annual headline is not a sum of quarters when no quarterly estimate is shown — do not invent quarter bands to add." as const;