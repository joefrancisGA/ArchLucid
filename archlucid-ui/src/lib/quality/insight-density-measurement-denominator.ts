/**
 * LK-14: career-surface denominator pinned to Decisioning harness/catalog constants.
 * Keep in sync with `InsightDensityEngineDistributionMarkdown` in ArchLucid.Decisioning.
 */
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";

export const INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT = 16;

/** Product `BuiltInFindingEngineTypeCatalog` size — not the harness slice alone. */
export const INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT = 39;

export const INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF =
  "/help/configuration-reference#insight-density-gate-tb-382";

export type InsightDensityMeasurementDenominatorPresentation = {
  readonly line: string;
  readonly helpHref: string;
};

/** Static denominator line when per-run engine counts are unavailable (legacy exports). */
export function formatInsightDensityMeasurementDenominatorLine(): InsightDensityMeasurementDenominatorPresentation {
  const { line, helpHref } = formatInsightDensityMeasurementFloorPresentation(null);

  return {
    line,
    helpHref,
  };
}
