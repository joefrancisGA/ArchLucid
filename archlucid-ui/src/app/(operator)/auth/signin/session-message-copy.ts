import { SESSION_IDLE_TIMEOUT_MINUTES } from "@/lib/auth/session-idle-timeout";

/** Recognized `reason` values that render the session-message view instead of auto-redirecting. */
export const SESSION_MESSAGE_REASONS = [
  "idle-timeout",
  "session-expired",
  "signed-out",
  "unauthorized",
] as const;

export type SessionMessageReason = (typeof SESSION_MESSAGE_REASONS)[number];

export type SessionMessageCopy = {
  readonly title: string;
  readonly body: string;
  /** When true, the view may name a safe return destination beside the sign-in CTA. */
  readonly showsReturnDestinationHint: boolean;
  /** Optional honest note about what persisted through sign-out. */
  readonly workPreservationNote?: string;
  /** Scope boundary when the claim-discipline band is omitted on auth handoffs. */
  readonly scopeNote?: string;
};

const SESSION_RECOVERY_SCOPE_NOTE =
  "This page covers sign-in recovery only — not a full audit export.";

const SERVER_WORK_PRESERVATION_NOTE =
  "Saved drafts and other server-stored work remain available after you sign in again. Unsaved changes in this browser tab were not preserved.";

const REASON_COPY: Record<SessionMessageReason, SessionMessageCopy> = {
  "idle-timeout": {
    title: "Your session expired",
    body: `For your security, ArchLucid signed you out after ${SESSION_IDLE_TIMEOUT_MINUTES} minutes of inactivity.`,
    showsReturnDestinationHint: true,
    workPreservationNote: SERVER_WORK_PRESERVATION_NOTE,
    scopeNote: SESSION_RECOVERY_SCOPE_NOTE,
  },
  "session-expired": {
    title: "Your session expired",
    body: "Your session is no longer active. Sign in again to continue.",
    showsReturnDestinationHint: true,
    workPreservationNote: SERVER_WORK_PRESERVATION_NOTE,
    scopeNote: SESSION_RECOVERY_SCOPE_NOTE,
  },
  "signed-out": {
    title: "You're signed out",
    body: "You've been signed out of ArchLucid.",
    showsReturnDestinationHint: true,
    scopeNote: SESSION_RECOVERY_SCOPE_NOTE,
  },
  unauthorized: {
    title: "Sign in required",
    body: "You need to sign in to access that page.",
    showsReturnDestinationHint: false,
    scopeNote: SESSION_RECOVERY_SCOPE_NOTE,
  },
};

/** Safe generic copy shown for a missing or unrecognized `reason` value — never echoes raw input. */
const DEFAULT_COPY: SessionMessageCopy = {
  title: "Your session expired",
  body: "Sign in again to continue.",
  showsReturnDestinationHint: false,
  scopeNote: SESSION_RECOVERY_SCOPE_NOTE,
};

export function isSessionMessageReason(reason: string | null | undefined): reason is SessionMessageReason {
  return SESSION_MESSAGE_REASONS.includes(reason as SessionMessageReason);
}

/** Resolves display copy for a `reason` query value; unknown/absent reasons get safe generic copy. */
export function getSessionMessageCopy(reason: string | null | undefined): SessionMessageCopy {
  return isSessionMessageReason(reason) ? REASON_COPY[reason] : DEFAULT_COPY;
}
