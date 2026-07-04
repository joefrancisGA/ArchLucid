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
  /** Set for reasons where the user was mid-session and may want to resume where they left off. */
  readonly showsReturnDestinationHint: boolean;
};

const REASON_COPY: Record<SessionMessageReason, SessionMessageCopy> = {
  "idle-timeout": {
    title: "Your session expired",
    body: "For your security, ArchLucid signed you out after a period of inactivity.",
    showsReturnDestinationHint: true,
  },
  "session-expired": {
    title: "Your session expired",
    body: "Your session is no longer active. Sign in again to continue.",
    showsReturnDestinationHint: true,
  },
  "signed-out": {
    title: "You're signed out",
    body: "You've been signed out of ArchLucid.",
    showsReturnDestinationHint: true,
  },
  unauthorized: {
    title: "Sign in required",
    body: "You need to sign in to access that page.",
    showsReturnDestinationHint: false,
  },
};

/** Safe generic copy shown for a missing or unrecognized `reason` value — never echoes raw input. */
const DEFAULT_COPY: SessionMessageCopy = {
  title: "Your session expired",
  body: "Sign in again to continue.",
  showsReturnDestinationHint: false,
};

export function isSessionMessageReason(reason: string | null | undefined): reason is SessionMessageReason {
  return SESSION_MESSAGE_REASONS.includes(reason as SessionMessageReason);
}

/** Resolves display copy for a `reason` query value; unknown/absent reasons get safe generic copy. */
export function getSessionMessageCopy(reason: string | null | undefined): SessionMessageCopy {
  return isSessionMessageReason(reason) ? REASON_COPY[reason] : DEFAULT_COPY;
}
