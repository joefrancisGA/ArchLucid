"use client";

import { cn } from "@/lib/utils";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { StatusTag } from "@/components/StatusTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  SCIM_ACTIVE_TOKENS_EMPTY_DESCRIPTION,
  SCIM_ACTIVE_TOKENS_EMPTY_TITLE,
  SCIM_ACTIVE_TOKENS_SECTION_DESCRIPTION,
  SCIM_ACTIVE_TOKENS_SECTION_TITLE,
  SCIM_REVOKE_ACTION,
  SCIM_REVOKING_ACTION,
  SCIM_TOKEN_STATUS_ACTIVE,
  SCIM_TOKEN_STATUS_REVOKED,
  SCIM_TOKEN_TABLE_COLUMN_ACTIONS,
  SCIM_TOKEN_TABLE_COLUMN_CREATED,
  SCIM_TOKEN_TABLE_COLUMN_IDENTIFIER,
  SCIM_TOKEN_TABLE_COLUMN_STATUS,
} from "@/lib/scim-provisioning-page-copy";

export type ScimTokenSummary = {
  id: string;
  createdUtc: string;
  revokedUtc?: string | null;
  publicLookupKey: string;
};

export type ScimTokensLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; tokens: ScimTokenSummary[] }
  | { status: "blocked"; message: string };

export type ScimProvisioningActiveTokensTableProps = {
  readonly state: ScimTokensLoadState;
  readonly revokingId: string | null;
  readonly onRequestRevoke: (token: ScimTokenSummary) => void;
};

function resolveTokenStatusLabel(token: ScimTokenSummary): string {
  if (token.revokedUtc !== null && token.revokedUtc !== undefined && token.revokedUtc.length > 0) {
    return SCIM_TOKEN_STATUS_REVOKED;
  }

  return SCIM_TOKEN_STATUS_ACTIVE;
}

function isTokenActive(token: ScimTokenSummary): boolean {
  return resolveTokenStatusLabel(token) === SCIM_TOKEN_STATUS_ACTIVE;
}

function resolveTokenStatusTagKind(token: ScimTokenSummary): EnterpriseStatusKind {
  if (isTokenActive(token)) {
    return "ready";
  }

  return "neutral";
}

export function ScimProvisioningActiveTokensTable(
  props: ScimProvisioningActiveTokensTableProps,
): React.JSX.Element {
  const { state, revokingId, onRequestRevoke } = props;

  return (
    <Card data-testid="scim-active-tokens-section">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SCIM_ACTIVE_TOKENS_SECTION_TITLE}</CardTitle>
        <CardDescription>{SCIM_ACTIVE_TOKENS_SECTION_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "loading" || state.status === "idle" ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading tokens…</p>
        ) : null}
        {state.status === "blocked" ? <OperatorApiProblem fallbackMessage={state.message} problem={null} /> : null}
        {state.status === "ready" && state.tokens.length === 0 ? (
          <div
            className="rounded-md border border-dashed border-neutral-300 px-4 py-6 text-center dark:border-neutral-700"
            data-testid="scim-no-tokens-empty-state"
          >
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {SCIM_ACTIVE_TOKENS_EMPTY_TITLE}
            </p>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {SCIM_ACTIVE_TOKENS_EMPTY_DESCRIPTION}
            </p>
          </div>
        ) : null}
        {state.status === "ready" && state.tokens.length > 0 ? (
          <EnterpriseTable ariaLabel={SCIM_ACTIVE_TOKENS_SECTION_TITLE} data-testid="scim-active-tokens-table">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_IDENTIFIER}</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_CREATED}</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_STATUS}</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_ACTIONS}</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {state.tokens.map((token) => (
                <EnterpriseTableRow key={token.id}>
                  <EnterpriseTableCell>
                    <span className="font-mono text-al-text-primary">{token.publicLookupKey}</span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{formatRelativeTime(token.createdUtc)}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <StatusTag
                      kind={resolveTokenStatusTagKind(token)}
                      label={resolveTokenStatusLabel(token)}
                      data-testid={`scim-token-status-${token.id}`}
                    />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    {isTokenActive(token) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={revokingId === token.id}
                        onClick={() => onRequestRevoke(token)}
                        data-testid={`scim-revoke-token-${token.id}`}
                      >
                        {revokingId === token.id ? SCIM_REVOKING_ACTION : SCIM_REVOKE_ACTION}
                      </Button>
                    ) : (
                      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>—</span>
                    )}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : null}
      </CardContent>
    </Card>
  );
}
