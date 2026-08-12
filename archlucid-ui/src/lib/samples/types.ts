/** Disclosure kind for buyer-facing sample surfaces (static JSON vs live SQL seed). */
export type SampleScenarioDisclosureKind = "illustrative-static" | "live-seed" | "api-fallback";

/**
 * Typed per-scenario sample package — single source for stable IDs, counts, labels, and deep links.
 * SQL A/B pins remain in `fixtures/demo-workspaces/`; this module must not invent a third ID universe.
 */
export type SampleScenarioDefinition = {
  readonly slug: string;
  readonly runId: string;
  readonly priorCompareRunId: string;
  readonly laterCompareRunId: string;
  readonly manifestId: string;
  readonly primaryFindingId: string;
  readonly primaryFindingTitle: string;
  readonly buyerReviewTitle: string;
  readonly buyerReviewPackageTitle: string;
  readonly policyPackDetailHref: string;
  readonly policyPackIdAliases: readonly string[];
  readonly ruleSetId: string;
  readonly tenantName: string;
  readonly tenantCatalogId: string;
  readonly workspaceLabel: string;
  readonly disclosureKind: SampleScenarioDisclosureKind;
  /** Category tokens for matching live findings to this scenario spine (e.g. regulated-depth themes). */
  readonly categoryTokens: readonly string[];
  readonly spineCounts: {
    readonly findingCount: number;
    readonly warningCount: number;
    readonly decisionCount: number;
  };
  readonly graphLinkedRecordCount: number;
  readonly auditTrailEventCount: number;
  readonly illustrativeAnnualizedExtractionUsd: number;
  readonly canonicalProofHref: string;
  readonly universeTextSignals: readonly string[];
};
