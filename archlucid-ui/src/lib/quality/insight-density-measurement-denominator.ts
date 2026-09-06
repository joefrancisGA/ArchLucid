/**
 * LK-14: career-surface denominator pinned to Decisioning harness/catalog constants.
 * Keep in sync with `InsightDensityEngineDistributionMarkdown` in ArchLucid.Decisioning.
 */
export const INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT = 16;

/** Product `BuiltInFindingEngineTypeCatalog` size — not the harness slice alone. */
export const INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT = 39;

export const INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF =
  "/help/configuration-reference#insight-density-gate-tb-382";

export type InsightDensityMeasurementDenominatorPresentation = {
  readonly line: string;
  readonly helpHref: string;
};

/** One honest denominator line for stamp / print / JSON career exports (ADR 0070 / LK-14). */
export function formatInsightDensityMeasurementDenominatorLine(): InsightDensityMeasurementDenominatorPresentation {
  const line =
    `Quality scores use ${INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT} of ${INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT} built-in engines. The others were not scored.`;

  return {
    line,
    helpHref: INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF,
  };
}
