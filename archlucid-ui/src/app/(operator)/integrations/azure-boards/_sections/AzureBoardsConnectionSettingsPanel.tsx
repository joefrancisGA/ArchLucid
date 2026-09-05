"use client";

import Link from "next/link";

import { LivelihoodPersistSaveStatus } from "@/components/operator/LivelihoodPersistSaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  AZURE_BOARDS_CONNECTION_AUDIT_TRAIL_LINK_LABEL,
  AZURE_BOARDS_CONNECTION_SETTINGS_LEAD,
  AZURE_BOARDS_CONNECTION_SETTINGS_TITLE,
  AZURE_BOARDS_FIELD_CREDENTIAL_STATUS,
  AZURE_BOARDS_FIELD_ORGANIZATION_URL,
  AZURE_BOARDS_FIELD_TOKEN_REFERENCE,
  AZURE_BOARDS_MUTATION_DISABLED_HELPER,
  AZURE_BOARDS_ORGANIZATION_URL_PLACEHOLDER,
  AZURE_BOARDS_SAVE_CONNECTION_LABEL,
  AZURE_BOARDS_SAVING_CONNECTION_LABEL,
  AZURE_BOARDS_TOKEN_REFERENCE_PLACEHOLDER,
} from "@/lib/azure-boards-page-copy";
import type { resolveAzureBoardsConnectionSaveGate } from "@/lib/azure-boards-integration-present";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AzureBoardsConnectionSettingsPanelProps = {
  readonly canMutate: boolean;
  readonly organizationUrl: string;
  readonly onOrganizationUrlChange: (value: string) => void;
  readonly tokenReference: string;
  readonly onTokenReferenceChange: (value: string) => void;
  readonly organizationDisplay: string;
  readonly credentialStatus: string;
  readonly credentialStatusKind: "ready" | "needs-attention" | "neutral" | "in-progress";
  readonly connectionProvenance: string;
  readonly connectionSaveError: string | null;
  readonly connectionSaveSuccess: string | null;
  readonly connectionLastSavedUtc: string | null;
  readonly connectionInlineSaveError: string | null;
  readonly connectionSaveGate: ReturnType<typeof resolveAzureBoardsConnectionSaveGate>;
  readonly isSavingConnection: boolean;
  readonly onSaveConnection: () => void;
};

export function AzureBoardsConnectionSettingsPanel({
  canMutate,
  organizationUrl,
  onOrganizationUrlChange,
  tokenReference,
  onTokenReferenceChange,
  organizationDisplay,
  credentialStatus,
  credentialStatusKind,
  connectionProvenance,
  connectionSaveError,
  connectionSaveSuccess,
  connectionLastSavedUtc,
  connectionInlineSaveError,
  connectionSaveGate,
  isSavingConnection,
  onSaveConnection,
}: AzureBoardsConnectionSettingsPanelProps): React.ReactElement {
  return (
    <section
      aria-labelledby="azure-boards-connection-settings-heading"
      id="azure-boards-connection-settings"
      className={cn("space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}
      data-testid="azure-boards-connection-settings"
    >
      <div>
        <h2 id="azure-boards-connection-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {AZURE_BOARDS_CONNECTION_SETTINGS_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AZURE_BOARDS_CONNECTION_SETTINGS_LEAD}
        </p>
      </div>

      {connectionSaveError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {connectionSaveError}
        </p>
      ) : null}

      {connectionSaveSuccess ? (
        <p className="m-0 text-al-text-secondary dark:text-neutral-200" role="status">
          {connectionSaveSuccess}
        </p>
      ) : null}

      <LivelihoodPersistSaveStatus
        lastSavedUtc={connectionLastSavedUtc}
        inlineSaveError={connectionInlineSaveError}
        testId="azure-boards-connection-save-status"
      />

      <div className="grid max-w-2xl gap-4">
        <div className="space-y-2">
          <Label htmlFor="azure-boards-org-url">{AZURE_BOARDS_FIELD_ORGANIZATION_URL}</Label>
          <Input
            id="azure-boards-org-url"
            value={organizationUrl}
            onChange={(event) => onOrganizationUrlChange(event.target.value)}
            placeholder={AZURE_BOARDS_ORGANIZATION_URL_PLACEHOLDER}
            disabled={!canMutate || isSavingConnection}
            data-testid="azure-boards-organization-url"
          />
          {!canMutate ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="azure-boards-organization-display">
              Saved: {organizationDisplay}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="azure-boards-token-ref">{AZURE_BOARDS_FIELD_TOKEN_REFERENCE}</Label>
          <Input
            id="azure-boards-token-ref"
            type="password"
            autoComplete="off"
            value={tokenReference}
            onChange={(event) => onTokenReferenceChange(event.target.value)}
            placeholder={AZURE_BOARDS_TOKEN_REFERENCE_PLACEHOLDER}
            disabled={!canMutate || isSavingConnection}
            data-testid="azure-boards-token-reference"
          />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Enter a new secure reference to replace the saved token. Leave blank to keep the existing reference.
          </p>
        </div>

        <div>
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {AZURE_BOARDS_FIELD_CREDENTIAL_STATUS}
          </dt>
          <dd className="m-0 mt-1" data-testid="azure-boards-credential-status">
            <StatusTag kind={credentialStatusKind} label={credentialStatus} />
          </dd>
        </div>

        <div data-testid="azure-boards-connection-provenance">
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Change history
          </dt>
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <p className="m-0" role="status">
              {connectionProvenance}
            </p>
            <p className="m-0 mt-2">
              <Link
                href={GOVERNANCE_AUDIT_PATH}
                className={OPERATOR_LINK.inline}
                data-testid="azure-boards-audit-trail-link"
              >
                {AZURE_BOARDS_CONNECTION_AUDIT_TRAIL_LINK_LABEL}
              </Link>
            </p>
          </dd>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onSaveConnection}
            disabled={!connectionSaveGate.allowed}
            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
          >
            {isSavingConnection ? AZURE_BOARDS_SAVING_CONNECTION_LABEL : AZURE_BOARDS_SAVE_CONNECTION_LABEL}
          </Button>
        </div>
        <WhyDisabledCtaHint
          reason={connectionSaveGate.reason}
          testId="azure-boards-save-connection-disabled-helper"
          className="max-w-3xl"
        />
      </div>

      {!canMutate ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_BOARDS_MUTATION_DISABLED_HELPER}</p>
      ) : null}
    </section>
  );
}
