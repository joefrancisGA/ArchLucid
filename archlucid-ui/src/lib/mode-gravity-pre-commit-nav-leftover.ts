/** MG-008 — Working bypasses pre-commit nav gate; docs must not describe Working as phase-0 locked. */
export const MODE_GRAVITY_PRE_COMMIT_NAV_DOC_ANCHOR =
  "use-effective-nav-committed-architecture-review" as const;

export const MODE_GRAVITY_WORKING_FULL_NAV_LINE =
  "Working seats unlock full authorized nav before first commit — pre-commit gating is eval-shaped leftover copy only." as const;

export const MODE_GRAVITY_FORBIDDEN_WORKING_PHASE_ZERO_MARKERS = [
  /working.*locked until finalize/i,
  /insights hide until finalize/i,
  /phase-0.*working/i,
] as const;
