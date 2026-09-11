/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY.md" as const;

export type CareerGravityNestedDeskLeakClass = "covered" | "bypass" | "mismatch" | "related" | "eval-ok";

export type CareerGravityNestedDeskRow = {
  readonly relativePath: string;
  readonly leakClass: CareerGravityNestedDeskLeakClass;
  readonly ownerPrompt: string;
};

export const CAREER_GRAVITY_NESTED_SEARCH_HELPER = "architectureNestedSearchPath" as const;

export const CAREER_GRAVITY_NESTED_DESK_DOOR_ROWS: readonly CareerGravityNestedDeskRow[] = [
  {
    relativePath: "archlucid-ui/src/lib/architecture/architecture-routes.ts",
    leakClass: "covered",
    ownerPrompt: "CG-007",
  },
  {
    relativePath: "archlucid-ui/src/hooks/use-effective-working-career-rehearsal-door.ts",
    leakClass: "mismatch",
    ownerPrompt: "CG-011",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-056",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/compare/ArchitectureNestedComparePageClient.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-057",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/graph/ArchitectureNestedGraphPageClient.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-058",
  },
  {
    relativePath:
      "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-060",
  },
  {
    relativePath: "archlucid-ui/src/lib/resolve-working-peer-ask-redirect-href.ts",
    leakClass: "related",
    ownerPrompt: "CG-056",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-056",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-057",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/evidence-graph/page.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-058",
  },
  {
    relativePath: "archlucid-ui/src/app/(operator)/insights/search-review-evidence/page.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-059",
  },
] as const;
