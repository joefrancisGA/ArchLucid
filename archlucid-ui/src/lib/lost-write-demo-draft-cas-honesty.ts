/**
 * LW-027: in-memory / demo draft hosts share DraftPatchStaleUpdatedUtcGuard, so Working
 * must not show a last-write-wins honesty banner. If a host later bypasses the guard,
 * flip this flag and add Working copy — never Guided eval chrome.
 */
export const LOST_WRITE_DEMO_DRAFT_HOST_USES_SAME_CAS_GUARD = true;

export const LOST_WRITE_WORKING_DEMO_DRAFT_LWW_LABEL: string | null =
  LOST_WRITE_DEMO_DRAFT_HOST_USES_SAME_CAS_GUARD
    ? null
    : "Demo draft save is last-write-wins on this host. Production Working CAS does not apply here.";
