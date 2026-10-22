/** IH-003 — Working strings that still teach “operate the review” when ArchitectureId is known. */

export const INHABIT_VOCABULARY_INVENTORY_DOC_PATH =
  "docs/architecture/INHABIT_VOCABULARY_INVENTORY.md" as const;

export type InhabitVocabularyLeakRow = {
  readonly surface: string;
  readonly relativePath: string;
  readonly leakPattern: string;
  readonly replacement: string;
  readonly ownerPrompt: string;
  readonly status: "open" | "shipped";
};

export const INHABIT_VOCABULARY_LEAK_ROWS: readonly InhabitVocabularyLeakRow[] = [
  {
    surface: "Nested desk findings subtitle",
    relativePath: "lib/system-not-job-findings-are-verbs-on-the-system.ts",
    leakPattern: "triage and disposition for child reviews",
    replacement: "inhabit / afternoon document / work this architecture",
    ownerPrompt: "IH-003",
    status: "shipped",
  },
  {
    surface: "Nested desk findings claim discipline",
    relativePath: "lib/inhabit/inhabit-findings-document-presentation.ts",
    leakPattern: "operate this review",
    replacement: "you inhabit this system; findings are verbs on the architecture",
    ownerPrompt: "IH-003",
    status: "shipped",
  },
  {
    surface: "Governance register subtitle (peer)",
    relativePath: "lib/system-not-job-findings-are-verbs-on-the-system.ts",
    leakPattern: "Monday-morning desk",
    replacement: "cross-architecture register — desk is architecture-nested findings",
    ownerPrompt: "IH-003",
    status: "open",
  },
  {
    surface: "First-review guide walkthrough",
    relativePath: "app/(operator)/architecture/first-review-guide",
    leakPattern: "run the pipeline",
    replacement: "Guided eval phrasing allowed — not a Working inhabit leak",
    ownerPrompt: "IH-003",
    status: "open",
  },
];
