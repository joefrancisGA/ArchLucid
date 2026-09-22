"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InfraEvidenceWorkbenchBuildProvenanceStrip } from "@/components/infra-evidence/InfraEvidenceWorkbenchBuildProvenanceStrip";
import { InfraEvidenceWorkbenchHeaderActions } from "@/components/infra-evidence/InfraEvidenceWorkbenchHeaderActions";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import {
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  createSecurityDeclaredConnection,
  listSecurityDeclaredConnections,
  revokeSecurityDeclaredConnection,
} from "@/lib/security-declared-connection-api";
import type {
  SecurityDeclaredConnectionRelationshipType,
  SecurityDeclaredConnectionRow,
} from "@/lib/security-declared-connection-types";
import { showError, showSuccess } from "@/lib/toast";

import { DeclaredConnectionsBreadcrumb } from "./DeclaredConnectionsBreadcrumb";

const MINIMUM_RATIONALE_LENGTH = 20;

function defaultExpirationIso(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 90);
  return date.toISOString();
}

export function DeclaredConnectionsWorkbenchClient() {
  const { productLine } = useProductLine();
  const resourcesPath = infrastructureResourcesPathForProductLine(productLine);
  const [rows, setRows] = useState<SecurityDeclaredConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revokingConnectionId, setRevokingConnectionId] = useState<string | null>(null);

  const [fromCloudResourceId, setFromCloudResourceId] = useState("");
  const [toCloudResourceId, setToCloudResourceId] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<SecurityDeclaredConnectionRelationshipType>("ConnectsTo");
  const [rationale, setRationale] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [expirationUtc, setExpirationUtc] = useState(defaultExpirationIso);
  const [approvedByActorKey, setApprovedByActorKey] = useState("");

  const canSubmit = useMemo(() => {
    return (
      fromCloudResourceId.trim().length > 0
      && toCloudResourceId.trim().length > 0
      && fromCloudResourceId.trim() !== toCloudResourceId.trim()
      && rationale.trim().length >= MINIMUM_RATIONALE_LENGTH
      && approvedByActorKey.trim().length > 0
      && expirationUtc.trim().length > 0
    );
  }, [
    approvedByActorKey,
    expirationUtc,
    fromCloudResourceId,
    rationale,
    toCloudResourceId,
  ]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const nextRows = await listSecurityDeclaredConnections();
      setRows(nextRows);
    } catch (error) {
      setRows([]);
      setLoadError(error instanceof Error ? error.message : "Could not load declared connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  async function handleCreate(): Promise<void> {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await createSecurityDeclaredConnection({
        fromCloudResourceId: fromCloudResourceId.trim(),
        toCloudResourceId: toCloudResourceId.trim(),
        relationshipType,
        rationale: rationale.trim(),
        evidenceReference: evidenceReference.trim().length > 0 ? evidenceReference.trim() : undefined,
        expirationUtc,
        approvedByActorKey: approvedByActorKey.trim(),
      });
      showSuccess("Declared connection saved.");
      setRationale("");
      setEvidenceReference("");
      await loadRows();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not save declared connection.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(connectionId: string): Promise<void> {
    if (revokingConnectionId != null) {
      return;
    }

    setRevokingConnectionId(connectionId);

    try {
      await revokeSecurityDeclaredConnection(connectionId);
      showSuccess("Declared connection revoked.");
      await loadRows();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not revoke declared connection.");
    } finally {
      setRevokingConnectionId(null);
    }
  }

  const scopeStatusBadge = (
    <StatusTag
      kind={rows.length > 0 ? "ready" : "needs-attention"}
      label={rows.length > 0 ? `${rows.length} declaration${rows.length === 1 ? "" : "s"}` : "No declarations yet"}
      data-testid="infra-declared-connections-scope-status"
    />
  );

  return (
    <OperatorPageContainer variant="full" className="space-y-4 py-4" data-testid="declared-connections-workbench">
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH}
        title={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_LEAD}
        claimDiscipline={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_CLAIM_DISCIPLINE}
        claimDisciplineTestId="infra-declared-connections-claim-discipline"
        metadata={<DeclaredConnectionsBreadcrumb />}
        actions={
          <InfraEvidenceWorkbenchHeaderActions
            shortcutsTestId="infra-declared-connections-page-shortcuts"
            scopeStatusBadge={scopeStatusBadge}
          />
        }
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PRIMARY_CONTENT_ID}
        className="flex w-full flex-col gap-4 scroll-mt-24"
        data-testid="infra-declared-connections-primary-content"
      >
        {loadError != null ? (
          <EnterpriseCompactEmptyState
            role="alert"
            title={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_LOAD_ERROR_TITLE}
            description={loadError}
            testId="infra-declared-connections-load-error-panel"
            footer={
              <Button type="button" size="sm" variant="primary" onClick={() => void loadRows()}>
                Retry load
              </Button>
            }
          />
        ) : null}

        <section className="space-y-3 rounded-md border border-border p-4" aria-labelledby="declared-connection-form-heading">
          <h2 id="declared-connection-form-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            Add declared connection
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Use cloud resource IDs from the{" "}
            <Link href={resourcesPath} className="text-al-link underline-offset-2 hover:underline">
              resource explorer
            </Link>
            . Connections are labeled HumanAssertion and expire unless renewed.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="from-cloud-resource-id">From cloud resource ID</Label>
              <Input
                id="from-cloud-resource-id"
                value={fromCloudResourceId}
                onChange={(event) => setFromCloudResourceId(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to-cloud-resource-id">To cloud resource ID</Label>
              <Input
                id="to-cloud-resource-id"
                value={toCloudResourceId}
                onChange={(event) => setToCloudResourceId(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="relationship-type">Relationship type</Label>
              <select
                id="relationship-type"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={relationshipType}
                onChange={(event) =>
                  setRelationshipType(event.target.value as SecurityDeclaredConnectionRelationshipType)}
              >
                <option value="ConnectsTo">ConnectsTo</option>
                <option value="DependsOn">DependsOn</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiration-utc">Expiration (UTC ISO)</Label>
              <Input
                id="expiration-utc"
                value={expirationUtc}
                onChange={(event) => setExpirationUtc(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="rationale">Rationale</Label>
              <Textarea
                id="rationale"
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="evidence-reference">Evidence reference (optional)</Label>
              <Input
                id="evidence-reference"
                value={evidenceReference}
                onChange={(event) => setEvidenceReference(event.target.value)}
                placeholder="Config file path, ticket, or runbook section"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="approved-by">Approver actor key</Label>
              <Input
                id="approved-by"
                value={approvedByActorKey}
                onChange={(event) => setApprovedByActorKey(event.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {!canSubmit ? (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="infra-declared-connections-submit-readiness">
              Complete both resource IDs, rationale ({MINIMUM_RATIONALE_LENGTH}+ characters), approver, and expiration before saving.
            </p>
          ) : null}

          <Button
            type="button"
            variant="default"
            disabled={!canSubmit || submitting}
            data-testid="infra-declared-connections-save"
            onClick={() => void handleCreate()}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </span>
            ) : (
              "Save declared connection"
            )}
          </Button>
        </section>

        <section className="space-y-2" aria-labelledby="declared-connections-table-heading">
          <h2 id="declared-connections-table-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            Active and historical declarations
          </h2>

          {loading ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading declared connections…
              </span>
            </p>
          ) : rows.length === 0 && loadError == null ? (
            <EnterpriseCompactEmptyState
              title="No declared connections yet"
              description="Save a HumanAssertion edge when inventory alone cannot prove connectivity."
              testId="infra-declared-connections-empty-state"
            />
          ) : (
            <EnterpriseTable ariaLabel="Declared connections">
              <EnterpriseTableHead>
                <EnterpriseTableRow>
                  <EnterpriseTableHeaderCell>From</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>To</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Type</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Expires</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                </EnterpriseTableRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {rows.map((row) => (
                  <EnterpriseTableRow key={row.connectionId}>
                    <EnterpriseTableCell className="font-mono text-xs">{row.fromCloudResourceId}</EnterpriseTableCell>
                    <EnterpriseTableCell className="font-mono text-xs">{row.toCloudResourceId}</EnterpriseTableCell>
                    <EnterpriseTableCell>{row.relationshipType}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <StatusTag
                        label={row.status}
                        kind={row.status === "Active" ? "ready" : "needs-attention"}
                      />
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{new Date(row.expirationUtc).toLocaleString()}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      {row.status === "Active" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={revokingConnectionId != null}
                          onClick={() => void handleRevoke(row.connectionId)}
                        >
                          {revokingConnectionId === row.connectionId ? "Revoking…" : "Revoke"}
                        </Button>
                      ) : (
                        "—"
                      )}
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          )}
        </section>

        <InfraEvidenceWorkbenchBuildProvenanceStrip testId="infra-declared-connections-build-provenance-limitation" />
      </main>
    </OperatorPageContainer>
  );
}
