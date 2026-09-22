/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_AS076_LEFTOVER_MATRIX_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_AS076_LEFTOVER_MATRIX.md" as const;

export type CareerGravityAs076MatrixRow = {
  readonly asId: string;
  readonly promptRelativePath: string;
  readonly leftoverPrompt: string;
};

export const CAREER_GRAVITY_AS076_MATRIX_ROWS: readonly CareerGravityAs076MatrixRow[] = [
  {
    asId: "076",
    promptRelativePath: ".cursor/prompts/architecture-spine-076-adr-0086-career-vs-rehearsal-doors.md",
    leftoverPrompt: "CG-001",
  },
  {
    asId: "077",
    promptRelativePath: ".cursor/prompts/architecture-spine-077-working-chrome-mode-chooser.md",
    leftoverPrompt: "CG-016",
  },
  {
    asId: "078",
    promptRelativePath: ".cursor/prompts/architecture-spine-078-career-door-requires-real-or-blocked.md",
    leftoverPrompt: "CG-020",
  },
  {
    asId: "079",
    promptRelativePath: ".cursor/prompts/architecture-spine-079-cannot-screenshot-simulator-ready.md",
    leftoverPrompt: "CG-002",
  },
  {
    asId: "080",
    promptRelativePath: ".cursor/prompts/architecture-spine-080-new-working-tenants-career-intent.md",
    leftoverPrompt: "CG-014",
  },
  {
    asId: "081",
    promptRelativePath: ".cursor/prompts/architecture-spine-081-guided-keeps-simulator-teaching.md",
    leftoverPrompt: "CG-052",
  },
  {
    asId: "082",
    promptRelativePath: ".cursor/prompts/architecture-spine-082-help-rehearsal-vs-career.md",
    leftoverPrompt: "CG-053",
  },
  {
    asId: "083",
    promptRelativePath: ".cursor/prompts/architecture-spine-083-cli-try-real-vs-rehearse.md",
    leftoverPrompt: "CG-054",
  },
  {
    asId: "084",
    promptRelativePath: ".cursor/prompts/architecture-spine-084-tests-career-rehearsal-chrome.md",
    leftoverPrompt: "CG-046",
  },
  {
    asId: "085",
    promptRelativePath: ".cursor/prompts/architecture-spine-085-no-host-mode-flip-ratchet.md",
    leftoverPrompt: "None",
  },
] as const;

export const CAREER_GRAVITY_AS076_INDEXED_INVENTORY_DOCS = [
  "docs/architecture/CAREER_GRAVITY_UNLABELED_READY_INVENTORY.md",
  "docs/architecture/CAREER_GRAVITY_EXPORT_WATERMARK_INVENTORY.md",
  "docs/architecture/CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY.md",
  "docs/architecture/CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_INVENTORY.md",
  "docs/architecture/CAREER_GRAVITY_OUTBOUND_INVENTORY.md",
  "docs/architecture/CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY.md",
  "docs/architecture/CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_INVENTORY.md",
  "docs/architecture/CAREER_GRAVITY_SPONSOR_ROI_SCORECARD_INVENTORY.md",
] as const;
