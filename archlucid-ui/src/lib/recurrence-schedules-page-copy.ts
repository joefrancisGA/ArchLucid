export const RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID = "recurrence-schedules-primary-content" as const;

export const RECURRENCE_SCHEDULES_FIRST_VIEWPORT_ID = "recurrence-schedules-first-viewport" as const;

export const RECURRENCE_SCHEDULES_SKIP_TARGET_ID = RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID;

export const RECURRENCE_SCHEDULES_SKIP_LINK_LABEL = "Skip to recurrence schedules" as const;

/** Buyer-facing copy for `/governance/recurrence-schedules` (GRX). */
export const RECURRENCE_SCHEDULES_PAGE_LEAD =
  "Define when architecture reviews repeat for an identity — ArchLucid clones the source review when each schedule comes due.";

export const RECURRENCE_SCHEDULES_BUYER_START_HERE_HELPER =
  "Pick a review to scope create and edit actions, then enable a schedule or open architecture reviews when cadence setup needs package context.";

export const RECURRENCE_SCHEDULES_LOAD_ERROR =
  "Could not load recurrence schedules for this workspace. Try again in a moment." as const;

export const RECURRENCE_SCHEDULES_LOAD_ERROR_RETRY_LABEL = "Try again" as const;

export const RECURRENCE_SCHEDULES_LOADING_STATUS = "Loading recurrence schedules…" as const;
