import type { EnterpriseStatusKind } from "@/lib/design-tokens";

/** Shared ITSM product connection statuses (Jira + ServiceNow). */
export type ItsmConnectionStatus =
  | "connected"
  | "setup-incomplete"
  | "connection-issue"
  | "testing"
  | "not-available";

export function itsmConnectionStatusTagKind(status: ItsmConnectionStatus): EnterpriseStatusKind {
  switch (status) {
    case "connected":
      return "ready";
    case "setup-incomplete":
    case "connection-issue":
      return "needs-attention";
    case "testing":
      return "in-progress";
    case "not-available":
      return "neutral";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
