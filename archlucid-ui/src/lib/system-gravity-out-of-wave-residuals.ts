/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS.md" as const;

export type SystemGravityOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type SystemGravityOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: SystemGravityOutOfWaveResidualStatus;
  readonly notes: string;
};

/** SG-082+ — explicit skips for wave 32 close audit; do not pretend shipped. */
export const SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS: readonly SystemGravityOutOfWaveResidualRow[] = [
  {
    item: "Compare architecture drafts",
    tracking: "R12 rejected alternative / ADR 0092",
    ownerPrompt: "SG-082",
    status: "not-shipped",
    notes: "Compare stays committed-manifest only (SN-038 / CE-017).",
  },
  {
    item: "Merge DraftRequests and Runs kernels",
    tracking: "ADR 0092",
    ownerPrompt: "SG-111",
    status: "not-shipped",
    notes: "Spawn-locked architecture drafts are not a second Career editor.",
  },
  {
    item: "Live presence (avatars, cursors, occupancy)",
    tracking: "ADR 0090 / LW-089 lease",
    ownerPrompt: "SG-112",
    status: "not-shipped",
    notes: "Work-lease is the collab primitive — not live presence or finding-comment chat.",
  },
  {
    item: "Collapse desktop review tabs behind More",
    tracking: "Product direction",
    ownerPrompt: "SG-113",
    status: "not-shipped",
    notes: "Review workspace tabs stay on the default strip.",
  },
  {
    item: "System-wide breadcrumbs",
    tracking: "Retired IA",
    ownerPrompt: "SG-114",
    status: "not-shipped",
    notes: "Desk continuity and nested locators replace breadcrumbs.",
  },
  {
    item: "Unseal to edit sealed parent",
    tracking: "ADR 0039",
    ownerPrompt: "SG-115",
    status: "not-shipped",
    notes: "Clone-from-snapshot is the sketch path.",
  },
  {
    item: "Remount cheap-envelope runner",
    tracking: "CE wave scope",
    ownerPrompt: "SG-116",
    status: "not-shipped",
    notes: "Do not re-run CE runner in SG.",
  },
  {
    item: "Re-implement daytime wait",
    tracking: "DW wave scope",
    ownerPrompt: "SG-117",
    status: "not-shipped",
    notes: "Do not re-run DW in SG.",
  },
  {
    item: "G-REAL-06 host Mode flip",
    tracking: "GTM owner program",
    ownerPrompt: "SG-118",
    status: "not-shipped",
    notes: "Host AgentExecution:Mode default unchanged.",
  },
];
