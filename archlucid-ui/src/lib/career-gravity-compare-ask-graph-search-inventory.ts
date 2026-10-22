/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_INVENTORY.md" as const;

export type CareerGravityAllDayVerb = "ask" | "compare" | "graph" | "search";

export type CareerGravityAllDayVerbRow = {
  readonly relativePath: string;
  readonly verb: CareerGravityAllDayVerb;
  readonly ownerPrompt: string;
};

export const CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_ROWS: readonly CareerGravityAllDayVerbRow[] = [
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx",
    verb: "ask",
    ownerPrompt: "CG-056",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskReviewScopeStrip.tsx",
    verb: "ask",
    ownerPrompt: "CG-056",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx",
    verb: "compare",
    ownerPrompt: "CG-057",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/evidence-graph/page.tsx",
    verb: "graph",
    ownerPrompt: "CG-058",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/graph/ArchitectureNestedGraphPageClient.tsx",
    verb: "graph",
    ownerPrompt: "CG-058",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/search-review-evidence/page.tsx",
    verb: "search",
    ownerPrompt: "CG-059",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient.tsx",
    verb: "ask",
    ownerPrompt: "CG-056",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/compare/ArchitectureNestedComparePageClient.tsx",
    verb: "compare",
    ownerPrompt: "CG-057",
  },
] as const;
