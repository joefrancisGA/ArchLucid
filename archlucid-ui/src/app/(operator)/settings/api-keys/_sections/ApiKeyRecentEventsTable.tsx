import { cn } from "@/lib/utils";

import {
  API_KEYS_AUDIT_COLUMN_ACTION,
  API_KEYS_AUDIT_COLUMN_ACTOR,
  API_KEYS_AUDIT_COLUMN_KEY_NAME,
  API_KEYS_AUDIT_COLUMN_OUTCOME,
  API_KEYS_AUDIT_COLUMN_TIME,
  API_KEYS_RECENT_EVENTS_EMPTY,
} from "@/lib/api-keys-settings-copy";
import type { ApiKeyAuditEvent } from "@/lib/api-keys-settings-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";

export type ApiKeyRecentEventsTableProps = {
  readonly events: readonly ApiKeyAuditEvent[];
};

function formatAuditActionLabel(action: ApiKeyAuditEvent["action"]): string {
  if (action === "key_created") {
    return "Key created";
  }

  if (action === "overlap_key_issued") {
    return "Overlap key issued";
  }

  if (action === "key_rotated") {
    return "Key rotated";
  }

  if (action === "key_revoked") {
    return "Key revoked";
  }

  return "Rotation failed";
}

function formatOutcomeLabel(outcome: ApiKeyAuditEvent["outcome"]): string {
  return outcome === "success" ? "Success" : "Failed";
}

export function ApiKeyRecentEventsTable(props: ApiKeyRecentEventsTableProps): React.JSX.Element {
  if (props.events.length === 0) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="api-keys-events-empty">
        {API_KEYS_RECENT_EVENTS_EMPTY}
      </p>
    );
  }

  return (
    <EnterpriseTable ariaLabel="Recent API key events" data-testid="api-keys-recent-events-table">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>{API_KEYS_AUDIT_COLUMN_TIME}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_AUDIT_COLUMN_ACTOR}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_AUDIT_COLUMN_ACTION}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_AUDIT_COLUMN_KEY_NAME}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_AUDIT_COLUMN_OUTCOME}</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.events.map((event) => (
          <EnterpriseTableRow key={event.id}>
            <EnterpriseTableCell>{formatRelativeTime(event.occurredAtUtc)}</EnterpriseTableCell>
            <EnterpriseTableCell>{event.actor}</EnterpriseTableCell>
            <EnterpriseTableCell>{formatAuditActionLabel(event.action)}</EnterpriseTableCell>
            <EnterpriseTableCell>{event.keyName}</EnterpriseTableCell>
            <EnterpriseTableCell>{formatOutcomeLabel(event.outcome)}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
