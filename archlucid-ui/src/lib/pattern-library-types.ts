export type PatternAdoptionSignal = "Common" | "Emerging" | "Rare" | "Declining";

export type PatternRiskSignal = "Low" | "Moderate" | "High";

export type PatternGovernanceSignal =
  | "Usually approved"
  | "Often requires exception"
  | "Needs evidence"
  | "Frequently flagged";

export type PatternPlatformFilter =
  | "All platforms"
  | "AWS"
  | "Azure"
  | "GCP"
  | "Multi-cloud"
  | "Evidence-only";

export type PatternDomainFilter =
  | "All domains"
  | "Financial services"
  | "Healthcare"
  | "Public sector"
  | "SaaS"
  | "General"
  | "Internal enterprise"
  | "Other";

export type PatternTypeFilter =
  | "All types"
  | "Connectivity"
  | "Application"
  | "Data"
  | "Integration"
  | "Security"
  | "AI and knowledge"
  | "Resilience"
  | "Migration";

export type PatternDataSourceFilter = "All sources" | "Sample data" | "Anonymized aggregate";

export type PatternTimeRangeFilter = "All time" | "Last 90 days" | "Last 12 months";

export type PatternLibraryRecord = {
  readonly patternKey: string;
  readonly name: string;
  readonly description: string;
  readonly domains: readonly Exclude<PatternDomainFilter, "All domains">[];
  readonly platforms: readonly Exclude<PatternPlatformFilter, "All platforms">[];
  readonly patternType: Exclude<PatternTypeFilter, "All types">;
  readonly adoption: PatternAdoptionSignal;
  readonly risk: PatternRiskSignal;
  readonly governance: PatternGovernanceSignal;
  readonly relatedControls: readonly string[];
  readonly relatedPolicyPacks: readonly string[];
  readonly reviewCountLabel: string;
  readonly tenantCountLabel: string;
  readonly overview: string;
  readonly whereAppears: string;
  readonly typicalRisks: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly governanceConsiderations: readonly string[];
  readonly relatedPolicyRules: readonly string[];
  readonly alternatives: readonly string[];
  readonly architectureShape: string;
  readonly reviewQuestions: readonly string[];
};

export type PatternLibraryFiltersState = {
  readonly query: string;
  readonly domain: PatternDomainFilter;
  readonly platform: PatternPlatformFilter;
  readonly patternType: PatternTypeFilter;
  readonly risk: PatternRiskSignal | "All risks";
  readonly adoption: PatternAdoptionSignal | "All adoption";
  readonly governance: PatternGovernanceSignal | "All policy areas";
  readonly dataSource: PatternDataSourceFilter;
  readonly timeRange: PatternTimeRangeFilter;
};

export type PatternLibrarySummary = {
  readonly patternsTracked: number;
  readonly domainsRepresented: number;
  readonly platformsRepresented: number;
  readonly reviewsContributingLabel: string;
  readonly minimumTenantThreshold: number;
  readonly lastUpdatedUtc: string;
};

export type PatternLibraryProvenance = {
  readonly badgeLabel: "Sample data" | "Demo data" | "Anonymized aggregate" | "Internal test data";
  readonly notice: string;
  readonly privacyNote: string;
};
