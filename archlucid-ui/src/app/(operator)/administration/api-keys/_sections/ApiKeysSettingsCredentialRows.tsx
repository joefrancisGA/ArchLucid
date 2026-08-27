"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IntegrationConnectChecklist,
  type IntegrationConnectChecklistStep,
} from "@/components/integrations/IntegrationConnectChecklist";
import {
  API_KEYS_ACTION_ISSUE_OVERLAP,
  API_KEYS_ACTION_ROTATE_ADMIN,
  API_KEYS_ACTION_ROTATE_READONLY,
  API_KEYS_ACTION_VIEW_AUDIT,
  API_KEYS_CREDENTIALS_SECTION_TITLE,
} from "@/lib/api-keys-settings-copy";
import type { ApiKeyPendingAction } from "@/lib/api-keys-settings-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ApiKeyCredentialTable, type ApiKeyCredentialRowModel } from "./ApiKeyCredentialTable";

export type ApiKeysSettingsCredentialRowsProps = {
  readonly credentialRows: readonly ApiKeyCredentialRowModel[];
  readonly rotating: boolean;
  readonly apiKeysIssueSteps: readonly IntegrationConnectChecklistStep[];
  readonly apiKeysIssueEmphasizedStepId: string;
  readonly onRememberPendingAction: (action: ApiKeyPendingAction) => void;
  readonly onScrollToAudit: () => void;
};

export function ApiKeysSettingsCredentialRows(props: ApiKeysSettingsCredentialRowsProps): React.ReactElement {
  const {
    credentialRows,
    rotating,
    apiKeysIssueSteps,
    apiKeysIssueEmphasizedStepId,
    onRememberPendingAction,
    onScrollToAudit,
  } = props;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{API_KEYS_CREDENTIALS_SECTION_TITLE}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={rotating}
            onClick={() => {
              onRememberPendingAction({ kind: "issue_overlap" });
            }}
          >
            {API_KEYS_ACTION_ISSUE_OVERLAP}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={rotating}
            onClick={() => {
              onRememberPendingAction({ kind: "rotate_readonly" });
            }}
          >
            {API_KEYS_ACTION_ROTATE_READONLY}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onScrollToAudit}>
            {API_KEYS_ACTION_VIEW_AUDIT}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={rotating}
            onClick={() => {
              onRememberPendingAction({ kind: "rotate_admin" });
            }}
          >
            {API_KEYS_ACTION_ROTATE_ADMIN}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <IntegrationConnectChecklist
          title="Issue checklist"
          steps={apiKeysIssueSteps}
          emphasizedStepId={apiKeysIssueEmphasizedStepId}
          testIdPrefix="api-keys-issue"
        />
        <ApiKeyCredentialTable
          rows={credentialRows}
          busy={rotating}
          onIssueOverlap={() => {
            onRememberPendingAction({ kind: "issue_overlap" });
          }}
          onRotateAdmin={() => {
            onRememberPendingAction({ kind: "rotate_admin" });
          }}
          onRotateReadOnly={() => {
            onRememberPendingAction({ kind: "rotate_readonly" });
          }}
        />
      </CardContent>
    </Card>
  );
}
