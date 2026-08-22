import { cn } from "@/lib/utils";

import {
  API_KEYS_TABLE_COLUMN_ACTIONS,
  API_KEYS_TABLE_COLUMN_CREATED,
  API_KEYS_TABLE_COLUMN_EXPIRES,
  API_KEYS_TABLE_COLUMN_LAST_USED,
  API_KEYS_TABLE_COLUMN_NAME,
  API_KEYS_TABLE_COLUMN_PERMISSION,
  API_KEYS_TABLE_COLUMN_STATUS,
} from "@/lib/api-keys-settings-copy";
import type { ApiKeyCredentialSlot } from "@/lib/api-keys-settings-types";
import { formatApiKeyFingerprints } from "@/lib/format-api-key-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { components } from "@/lib/api-types.generated";

type ApiKeySlotStatusDto = components["schemas"]["ApiKeySlotStatusDto"];

export type ApiKeyCredentialRowModel = {
  readonly slot: ApiKeyCredentialSlot;
  readonly keyName: string;
  readonly permissionLabel: string;
  readonly slotStatus: ApiKeySlotStatusDto | undefined;
  readonly statusLabel: string;
};

export type ApiKeyCredentialTableProps = {
  readonly rows: readonly ApiKeyCredentialRowModel[];
  readonly onRotateAdmin: () => void;
  readonly onIssueOverlap: () => void;
  readonly onRotateReadOnly: () => void;
  readonly busy: boolean;
};

function formatExpiresLabel(expiresAtUtc: string | null | undefined): string {
  if (expiresAtUtc === null || expiresAtUtc === undefined || expiresAtUtc.trim().length === 0) {
    return " — ";
  }

  return expiresAtUtc;
}

function formatCreatedLabel(slotStatus: ApiKeySlotStatusDto | undefined): string {
  if (slotStatus?.isConfigured === true) {
    return "Configured";
  }

  return " — ";
}

function renderRowActions(
  row: ApiKeyCredentialRowModel,
  props: ApiKeyCredentialTableProps,
): React.JSX.Element {
  if (row.slot === "Admin") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={props.busy}
          onClick={props.onIssueOverlap}
        >
          Issue overlap
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={props.busy}
          onClick={props.onRotateAdmin}
        >
          Rotate
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={props.busy || row.slotStatus?.isConfigured !== true}
      onClick={props.onRotateReadOnly}
    >
      Rotate
    </Button>
  );
}

export function ApiKeyCredentialTable(props: ApiKeyCredentialTableProps): React.JSX.Element {
  return (
    <EnterpriseTable ariaLabel="API key credentials" data-testid="api-keys-credential-table">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>{API_KEYS_TABLE_COLUMN_NAME}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_TABLE_COLUMN_PERMISSION}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_TABLE_COLUMN_CREATED}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_TABLE_COLUMN_LAST_USED}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_TABLE_COLUMN_EXPIRES}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_TABLE_COLUMN_STATUS}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{API_KEYS_TABLE_COLUMN_ACTIONS}</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.rows.map((row) => (
          <EnterpriseTableRow key={row.slot} data-testid={`api-key-row-${row.slot.toLowerCase()}`}>
            <EnterpriseTableCell>
              <div>
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.keyName}</p>
                <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                  {formatApiKeyFingerprints(row.slotStatus?.maskedSegments ?? [])}
                </p>
              </div>
            </EnterpriseTableCell>
            <EnterpriseTableCell>{row.permissionLabel}</EnterpriseTableCell>
            <EnterpriseTableCell>{formatCreatedLabel(row.slotStatus)}</EnterpriseTableCell>
            <EnterpriseTableCell>—</EnterpriseTableCell>
            <EnterpriseTableCell>{formatExpiresLabel(row.slotStatus?.expiresAtUtc)}</EnterpriseTableCell>
            <EnterpriseTableCell>{row.statusLabel}</EnterpriseTableCell>
            <EnterpriseTableCell>{renderRowActions(row, props)}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
