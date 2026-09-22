/** Relative to repository root (parent of archlucid-ui). */
export const MODE_GRAVITY_EXPERIENCE_FLAGS_INVENTORY_DOC_PATH =
  "docs/architecture/MODE_GRAVITY_EXPERIENCE_FLAGS_INVENTORY.md" as const;

export type ModeGravityExperienceFlagLeakRisk = "low" | "medium" | "high";

export type ModeGravityExperienceFlagRow = {
  readonly flag: string;
  readonly workingEffect: string;
  readonly guidedEffect: string;
  readonly leakRisk: ModeGravityExperienceFlagLeakRisk;
  readonly ownerPrompt: string;
};

/** MG-002 — shrink-only inventory; no flag deletion in this wave. */
export const MODE_GRAVITY_EXPERIENCE_FLAG_ROWS: readonly ModeGravityExperienceFlagRow[] = [
  {
    flag: "workspaceMode",
    workingEffect: "Dense instrument; Career door visible",
    guidedEffect: "Eval teaching chrome; no Career door",
    leakRisk: "medium",
    ownerPrompt: "MG-005",
  },
  {
    flag: "workingCareerRehearsalDoor",
    workingEffect: "Execute gravity on Working only",
    guidedEffect: "N/A (chooser hidden)",
    leakRisk: "high",
    ownerPrompt: "CG-001",
  },
  {
    flag: "NEXT_PUBLIC_OPERATOR_EXPERIENCE",
    workingEffect: "Engineering density (IDs, COGS)",
    guidedEffect: "Same density opt-in",
    leakRisk: "medium",
    ownerPrompt: "MG-004",
  },
  {
    flag: "NEXT_PUBLIC_DEMO_MODE / DEMO_STATIC_OPERATOR",
    workingEffect: "Eval chrome when set",
    guidedEffect: "Eval chrome",
    leakRisk: "high",
    ownerPrompt: "MG-006",
  },
  {
    flag: "productLine",
    workingEffect: "Packaging filter; shared doors (CG-017)",
    guidedEffect: "Same",
    leakRisk: "medium",
    ownerPrompt: "MG-007",
  },
  {
    flag: "AgentExecution:Mode (host)",
    workingEffect: "Structural execute; server-side",
    guidedEffect: "Same",
    leakRisk: "high",
    ownerPrompt: "MG-014",
  },
];
