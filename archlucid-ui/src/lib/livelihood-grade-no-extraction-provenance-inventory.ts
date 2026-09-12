/** Relative to repository root (parent of archlucid-ui). */
export const LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_INVENTORY_DOC_PATH =
  "docs/architecture/LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_INVENTORY.md" as const;

export type LivelihoodGradeNoExtractionProvenanceRow = {
  readonly surface: string;
  readonly provenanceGap: string;
  readonly ownerPrompt: string;
};

export const LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS: readonly LivelihoodGradeNoExtractionProvenanceRow[] =
  [
    {
      surface: "Decision-grade finding emission",
      provenanceGap: "Kind A/B without source passage",
      ownerPrompt: "LN-005",
    },
    {
      surface: "Finding inspect desk",
      provenanceGap: "Citation chips on decision-grade rows",
      ownerPrompt: "LN-028",
    },
    {
      surface: "Pixel diagram intake",
      provenanceGap: "NotVerifiable shapes must not mint decision-grade",
      ownerPrompt: "LN-009",
    },
    {
      surface: "Architect restatement",
      provenanceGap: "Restatement cannot mint hard without citation",
      ownerPrompt: "LN-036",
    },
  ];
