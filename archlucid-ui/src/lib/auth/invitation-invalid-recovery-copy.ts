import { AUTH_CALLBACK_ACCESS_REQUEST_ACTION } from "@/lib/auth/access-request-copy";
import {
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
} from "@/lib/auth/session-expired-page-copy";

export type InvitationRecoveryContext =
  | "missing-token"
  | "invalid"
  | "expired"
  | "revoked"
  | "accepted"
  | "validation-failed";

/** Sign in without persisting or passing the broken invitation token (TB-1474). */
export const AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_PATH = "/auth/signin" as const;

export const AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_LABEL = "Sign in without this invitation";

export const AUTH_INVITE_REQUEST_ACCESS_PATH = "/signup" as const;

export { AUTH_CALLBACK_ACCESS_REQUEST_ACTION as AUTH_INVITE_REQUEST_ACCESS_LABEL };

export const AUTH_INVITE_HELP_PATH = "/help" as const;

export const AUTH_INVITE_HELP_LABEL = "Help";

export { SESSION_EXPIRED_SECONDARY_EXIT_PATH as AUTH_INVITE_PUBLIC_EXIT_PATH };

export { SESSION_EXPIRED_SECONDARY_EXIT_LABEL as AUTH_INVITE_PUBLIC_EXIT_LABEL };

export const AUTH_INVITE_VALIDATION_RETRY_LABEL = "Try again";

export const AUTH_INVITE_VALIDATION_FAILED_MESSAGE =
  "We could not validate this invitation. Try again or contact your administrator.";

export function resolveInvalidInvitationMessage(context: InvitationRecoveryContext): string {
  switch (context) {
    case "expired":
      return "This invitation has expired. Ask your administrator to send a new invitation.";
    case "revoked":
      return "This invitation is no longer active.";
    case "accepted":
      return "This invitation has already been used.";
    case "validation-failed":
      return AUTH_INVITE_VALIDATION_FAILED_MESSAGE;
    case "missing-token":
    case "invalid":
    default:
      return "This invitation link is not valid.";
  }
}

export function mapInvitationStatusToRecoveryContext(
  status: "Valid" | "Invalid" | "Expired" | "Revoked" | "Accepted",
): InvitationRecoveryContext | null {
  switch (status) {
    case "Valid":
      return null;
    case "Expired":
      return "expired";
    case "Revoked":
      return "revoked";
    case "Accepted":
      return "accepted";
    default:
      return "invalid";
  }
}
