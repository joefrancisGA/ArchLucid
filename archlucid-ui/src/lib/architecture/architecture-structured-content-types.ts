export const ARCHITECTURE_STRUCTURED_SECTION_KEYS = [
  "sponsor-report",
  "business-outcome",
  "scope",
  "users-and-stakeholders",
  "systems-and-services",
  "external-integrations",
  "data-flows",
  "trust-boundaries",
  "constraints",
  "risks",
  "assumptions",
  "open-questions",
] as const;

export type ArchitectureStructuredSectionKey = (typeof ARCHITECTURE_STRUCTURED_SECTION_KEYS)[number];

export type ArchitectureContentProvenance = "asserted" | "inferred";

export type ArchitectureStructuredEntity = {
  readonly label: string;
  readonly detail: string | null;
  readonly provenance: ArchitectureContentProvenance;
};

export type ArchitectureStructuredSection = {
  readonly key: ArchitectureStructuredSectionKey;
  readonly title: string;
  readonly narrativeMarkdown: string | null;
  readonly entities: readonly ArchitectureStructuredEntity[];
  readonly provenance: ArchitectureContentProvenance;
};

export type ArchitectureCreationUserAssertions = {
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly businessOutcome: string;
  readonly peopleAndSystems: readonly { readonly label: string; readonly kind: string }[];
};

export type ArchitectureStructuredParseResult = {
  readonly sections: readonly ArchitectureStructuredSection[];
  readonly hasPartialParseFailure: boolean;
  readonly suppressedArtifactCount: number;
  readonly sourceText: string;
};

export const ARCHITECTURE_STRUCTURED_SECTION_TITLES: Record<ArchitectureStructuredSectionKey, string> = {
  "sponsor-report": "Sponsor report",
  "business-outcome": "Business outcome",
  scope: "Scope",
  "users-and-stakeholders": "Users and stakeholders",
  "systems-and-services": "Systems and services",
  "external-integrations": "External integrations",
  "data-flows": "Data flows",
  "trust-boundaries": "Trust boundaries",
  constraints: "Constraints",
  risks: "Risks",
  assumptions: "Assumptions",
  "open-questions": "Open questions",
};
