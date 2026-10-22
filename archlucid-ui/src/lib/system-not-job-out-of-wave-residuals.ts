/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS_DOC_PATH =
  "docs/architecture/SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md" as const;

export type SystemNotJobOutOfWaveResidualStatus = "not-shipped" | "deferred";

export type SystemNotJobOutOfWaveResidualRow = {
  readonly item: string;
  readonly tracking: string;
  readonly ownerPrompt: string;
  readonly status: SystemNotJobOutOfWaveResidualStatus;
  readonly notes: string;
};

/** SN-038+ — explicit skips recorded for SN-040 close audit; do not pretend shipped. */
export const SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUAL_ROWS: readonly SystemNotJobOutOfWaveResidualRow[] = [
  {
    item: "Draft-to-draft Compare",
    tracking: "R12 rejected alternative",
    ownerPrompt: "SN-038",
    status: "not-shipped",
    notes:
      "Compare remains committed-manifest only. SN-014 is the allowed Compare path (labeled envelope runs). Cheap sketch path is clone-from-snapshot per ADR 0092.",
  },
  {
    item: "Live presence (avatars, cursors, occupancy heartbeats)",
    tracking: "ADR 0090 / LW-089 lease",
    ownerPrompt: "SN-039",
    status: "not-shipped",
    notes:
      "Concurrent desk is LW-089 work-lease, not this wave. Collab strip stays history; no UI occupancy or finding-comment chat.",
  },
];
