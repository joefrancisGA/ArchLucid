"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, Loader2 } from "lucide-react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InfraEvidenceWorkbenchBuildProvenanceStrip } from "@/components/infra-evidence/InfraEvidenceWorkbenchBuildProvenanceStrip";
import { InfraEvidenceWorkbenchHeaderActions } from "@/components/infra-evidence/InfraEvidenceWorkbenchHeaderActions";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ShortcutHint } from "@/components/ShortcutHint";
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
import { InteractiveChip } from "@/components/ui/interactive-chip";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CTA_WIDTH, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  clearDeclaredConnectionFormDraft,
  declaredConnectionsDraftStorageKey,
  readDeclaredConnectionFormDraft,
  writeDeclaredConnectionFormDraft,
} from "@/lib/governance/declared-connections-form-draft";
import {
  DECLARED_CONNECTIONS_FOCUS_FROM_SHORTCUT,
  DECLARED_CONNECTIONS_PAGE_SHORTCUTS,
  DECLARED_CONNECTIONS_SAVE_SHORTCUT,
} from "@/lib/governance/declared-connections-page-shortcuts";
import {
  countDeclaredConnectionsByStatus,
  declaredConnectionsFilterHrefFromSearch,
  filterDeclaredConnectionsByStatus,
  parseDeclaredConnectionsStatusFilter,
  type DeclaredConnectionsStatusFilter,
} from "@/lib/governance/declared-connections-table-filter";
import {
  countActiveDeclaredConnections,
  isExpirationUtcInFuture,
  resolveDeclaredConnectionDisplayStatus,
  sortDeclaredConnectionsByExpiry,
} from "@/lib/governance/declared-connections-status";
import {
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
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
import { cn } from "@/lib/utils";

import { DeclaredConnectionsBreadcrumb } from "./DeclaredConnectionsBreadcrumb";

const MINIMUM_RATIONALE_LENGTH = 20;

function defaultExpirationIso(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 90);
  return date.toISOString();
}

function formatRelativeExpiry(expirationUtc: string): string {
  const expiryMs = Date.parse(expirationUtc);
  const deltaMs = expiryMs - Date.now();
  const days = Math.round(deltaMs / (24 * 60 * 60 * 1000));

  if (Number.isNaN(expiryMs)) {
    return "";
  }

  if (days < 0) {
    return "expired";
  }

  if (days === 0) {
    return "expires today";
  }

  return `in ${days} day${days === 1 ? "" : "s"}`;
}

function statusTagKind(status: ReturnType<typeof resolveDeclaredConnectionDisplayStatus>): "ready" | "needs-attention" | "blocked" | "neutral" {
  if (status === "Active") {
    return "ready";
  }

  if (status === "NearExpiry") {
    return "needs-attention";
  }

  if (status === "Revoked") {
    return "blocked";
  }

  return "neutral";
}

export function DeclaredConnectionsWorkbenchClient() {
  const { productLine } = useProductLine();
  const pathname = usePathname() ?? GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH;
  const router = useRouter();
  const searchParams = useSearchParams();
  const resourcesPath = infrastructureResourcesPathForProductLine(productLine);
  const draftStorageKey = declaredConnectionsDraftStorageKey(productLine, pathname);
  const statusFilter = parseDeclaredConnectionsStatusFilter(searchParams.get("status"));
  const fromInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<SecurityDeclaredConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revokingConnectionId, setRevokingConnectionId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<SecurityDeclaredConnectionRow | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [highlightRowId, setHighlightRowId] = useState<string | null>(null);

  const [fromCloudResourceId, setFromCloudResourceId] = useState("");
  const [toCloudResourceId, setToCloudResourceId] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<SecurityDeclaredConnectionRelationshipType>("ConnectsTo");
  const [rationale, setRationale] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [expirationUtc, setExpirationUtc] = useState(defaultExpirationIso);
  const [approvedByActorKey, setApprovedByActorKey] = useState("");

  useEffect(() => {
    const draft = readDeclaredConnectionFormDraft(draftStorageKey);

    if (draft == null) {
      return;
    }

    setFromCloudResourceId(draft.fromCloudResourceId);
    setToCloudResourceId(draft.toCloudResourceId);
    setRelationshipType(draft.relationshipType);
    setRationale(draft.rationale);
    setEvidenceReference(draft.evidenceReference);
    setExpirationUtc(draft.expirationUtc);
    setApprovedByActorKey(draft.approvedByActorKey);
  }, [draftStorageKey]);

  useEffect(() => {
    writeDeclaredConnectionFormDraft(draftStorageKey, {
      fromCloudResourceId,
      toCloudResourceId,
      relationshipType,
      rationale,
      evidenceReference,
      expirationUtc,
      approvedByActorKey,
    });
  }, [
    approvedByActorKey,
    draftStorageKey,
    evidenceReference,
    expirationUtc,
    fromCloudResourceId,
    rationale,
    relationshipType,
    toCloudResourceId,
  ]);

  const sameEndpointError =
    fromCloudResourceId.trim().length > 0
    && toCloudResourceId.trim().length > 0
    && fromCloudResourceId.trim() === toCloudResourceId.trim();

  const expirationFuture = isExpirationUtcInFuture(expirationUtc);
  const expirationError =
    expirationUtc.trim().length > 0 && !expirationFuture ? "Expiration must be a future UTC instant." : null;

  const canSubmit = useMemo(() => {
    return (
      fromCloudResourceId.trim().length > 0
      && toCloudResourceId.trim().length > 0
      && !sameEndpointError
      && rationale.trim().length >= MINIMUM_RATIONALE_LENGTH
      && approvedByActorKey.trim().length > 0
      && expirationUtc.trim().length > 0
      && expirationFuture
    );
  }, [
    approvedByActorKey,
    expirationFuture,
    expirationUtc,
    fromCloudResourceId,
    rationale,
    sameEndpointError,
    toCloudResourceId,
  ]);

  const loadRows = useCallback(async (keepExisting: boolean) => {
    if (!keepExisting) {
      setLoading(true);
    }

    setLoadError(null);

    try {
      const nextRows = await listSecurityDeclaredConnections();
      setRows(nextRows);
    } catch (error) {
      if (!keepExisting) {
        setRows([]);
      }

      setLoadError(error instanceof Error ? error.message : "Could not load declared connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows(false);
  }, [loadRows]);

  const filteredRows = useMemo(
    () => sortDeclaredConnectionsByExpiry(filterDeclaredConnectionsByStatus(rows, statusFilter)),
    [rows, statusFilter],
  );
  const statusCounts = useMemo(() => countDeclaredConnectionsByStatus(rows), [rows]);
  const activeCount = useMemo(() => countActiveDeclaredConnections(rows), [rows]);

  const scopeStatusBadge = loading ? (
    <StatusTag kind="neutral" label="Loading declarations…" data-testid="infra-declared-connections-scope-status" />
  ) : loadError != null ? (
    <StatusTag kind="blocked" label="Blocked" data-testid="infra-declared-connections-scope-status" />
  ) : activeCount > 0 ? (
    <StatusTag
      kind="ready"
      label={`${activeCount} active declaration${activeCount === 1 ? "" : "s"}`}
      data-testid="infra-declared-connections-scope-status"
    />
  ) : (
    <StatusTag kind="neutral" label="No active declarations" data-testid="infra-declared-connections-scope-status" />
  );

  async function handleCreate(): Promise<void> {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const createdConnectionId = await createSecurityDeclaredConnection({
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
      clearDeclaredConnectionFormDraft(draftStorageKey);

      await loadRows(true);

      if (createdConnectionId.trim().length > 0) {
        setHighlightRowId(createdConnectionId);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not save declared connection.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRevoke(): Promise<void> {
    if (revokeTarget == null || revokingConnectionId != null) {
      return;
    }

    const connectionId = revokeTarget.connectionId;
    setRevokingConnectionId(connectionId);

    try {
      await revokeSecurityDeclaredConnection(connectionId);
      showSuccess("Declared connection revoked.");
      setRevokeTarget(null);
      await loadRows(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not revoke declared connection.");
    } finally {
      setRevokingConnectionId(null);
    }
  }

  useKeyboardShortcuts({
    [DECLARED_CONNECTIONS_SAVE_SHORTCUT]: {
      handler: () => {
        void handleCreate();
      },
      description: "Save declared connection",
      allowInInput: true,
    },
    [DECLARED_CONNECTIONS_FOCUS_FROM_SHORTCUT]: {
      handler: () => {
        fromInputRef.current?.focus();
      },
      description: "Focus From resource ID",
    },
  });

  const setStatusFilter = (filter: DeclaredConnectionsStatusFilter) => {
    router.replace(declaredConnectionsFilterHrefFromSearch(searchParams.toString(), filter, pathname), {
      scroll: false,
    });
  };

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
            shortcuts={DECLARED_CONNECTIONS_PAGE_SHORTCUTS}
            scopeStatusBadge={scopeStatusBadge}
            extraShortcutHints={
              <>
                ; <ShortcutHint shortcut={DECLARED_CONNECTIONS_SAVE_SHORTCUT} /> save;{" "}
                <ShortcutHint shortcut={DECLARED_CONNECTIONS_FOCUS_FROM_SHORTCUT} /> focus From
              </>
            }
          />
        }
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PRIMARY_CONTENT_ID}
        className="flex w-full max-w-none flex-col gap-4 scroll-mt-24"
        data-testid="infra-declared-connections-primary-content"
        aria-busy={loading}
      >
        {loadError != null ? (
          <EnterpriseCompactEmptyState
            role="alert"
            title={GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_LOAD_ERROR_TITLE}
            description={loadError}
            testId="infra-declared-connections-load-error-panel"
            footer={
              <Button type="button" size="sm" variant="primary" onClick={() => void loadRows(false)}>
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
            <Link href={resourcesPath} target="_blank" rel="noopener noreferrer" className={OPERATOR_LINK.inline}>
              resource explorer
            </Link>
            . Connections are labeled HumanAssertion and expire unless renewed.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="from-cloud-resource-id">From Cloud Resource ID</Label>
              <Input
                ref={fromInputRef}
                id="from-cloud-resource-id"
                className="font-mono text-xs"
                value={fromCloudResourceId}
                onChange={(event) => setFromCloudResourceId(event.target.value.trim())}
                autoComplete="off"
                aria-invalid={sameEndpointError}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="to-cloud-resource-id">To Cloud Resource ID</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Swap From and To resource IDs"
                  onClick={() => {
                    setFromCloudResourceId(toCloudResourceId);
                    setToCloudResourceId(fromCloudResourceId);
                  }}
                >
                  <ArrowLeftRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <Input
                id="to-cloud-resource-id"
                className="font-mono text-xs"
                value={toCloudResourceId}
                onChange={(event) => setToCloudResourceId(event.target.value.trim())}
                autoComplete="off"
                aria-invalid={sameEndpointError}
              />
              {sameEndpointError ? (
                <p className="m-0 text-sm text-red-700" role="alert" data-testid="infra-declared-connections-same-endpoint-error">
                  From and To must be different cloud resource IDs.
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="relationship-type">Relationship Type</Label>
              <Select value={relationshipType} onValueChange={(value) => setRelationshipType(value as SecurityDeclaredConnectionRelationshipType)}>
                <SelectTrigger id="relationship-type" aria-describedby="relationship-type-helper">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ConnectsTo">ConnectsTo</SelectItem>
                  <SelectItem value="DependsOn">DependsOn</SelectItem>
                </SelectContent>
              </Select>
              <p id="relationship-type-helper" className={OPERATOR_TYPOGRAPHY.helper}>
                ConnectsTo asserts directional connectivity; DependsOn asserts an upstream dependency.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiration-utc">Expiration (UTC ISO)</Label>
              <Input
                id="expiration-utc"
                value={expirationUtc}
                onChange={(event) => setExpirationUtc(event.target.value)}
                autoComplete="off"
                aria-invalid={expirationError != null}
              />
              {expirationError != null ? (
                <p className="m-0 text-sm text-red-700" role="alert">{expirationError}</p>
              ) : null}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="rationale">Rationale</Label>
              <Textarea
                id="rationale"
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
                rows={3}
                aria-describedby="rationale-counter"
              />
              <p id="rationale-counter" className={OPERATOR_TYPOGRAPHY.helper}>
                {rationale.trim().length}/{MINIMUM_RATIONALE_LENGTH} characters minimum
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="evidence-reference">Evidence Reference (optional)</Label>
              <Input
                id="evidence-reference"
                value={evidenceReference}
                onChange={(event) => setEvidenceReference(event.target.value)}
                placeholder="Config file path, ticket, or runbook section"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="approved-by">Approver Actor Key</Label>
              <Input
                id="approved-by"
                value={approvedByActorKey}
                onChange={(event) => setApprovedByActorKey(event.target.value)}
                autoComplete="off"
                aria-describedby="approved-by-helper"
              />
              <p id="approved-by-helper" className={OPERATOR_TYPOGRAPHY.helper}>
                Use the approver identity key from your tenant directory (email or UPN format).
              </p>
            </div>
          </div>

          {!canSubmit ? (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="infra-declared-connections-submit-readiness">
              Complete both resource IDs, rationale ({MINIMUM_RATIONALE_LENGTH}+ characters), approver, and a future expiration before saving.
            </p>
          ) : null}

          <Button
            type="button"
            variant="default"
            className={CTA_WIDTH.content}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="declared-connections-table-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
              Active and historical declarations
            </h2>
            <div className="flex flex-wrap gap-2" data-testid="infra-declared-connections-status-filters">
              {(["all", "Active", "NearExpiry", "Expired", "Revoked"] as const).map((filter) => (
                <InteractiveChip
                  key={filter}
                  aria-pressed={statusFilter === filter}
                  data-testid={`infra-declared-connections-filter-${filter}`}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter === "all" ? "All" : filter === "NearExpiry" ? "Near expiry" : filter} ({statusCounts[filter]})
                </InteractiveChip>
              ))}
            </div>
          </div>

          {loading && rows.length === 0 ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading declared connections…
              </span>
            </p>
          ) : filteredRows.length === 0 && loadError == null && !loading ? (
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
                {filteredRows.map((row) => {
                  const displayStatus = resolveDeclaredConnectionDisplayStatus(row);
                  const expanded = expandedRowId === row.connectionId;

                  return (
                    <Fragment key={row.connectionId}>
                      <EnterpriseTableRow
                        data-testid={`infra-declared-connection-row-${row.connectionId}`}
                        className={highlightRowId === row.connectionId ? "bg-teal-50/40 dark:bg-teal-950/20" : undefined}
                      >
                        <EnterpriseTableCell className="font-mono text-xs">{row.fromCloudResourceId}</EnterpriseTableCell>
                        <EnterpriseTableCell className="font-mono text-xs">{row.toCloudResourceId}</EnterpriseTableCell>
                        <EnterpriseTableCell>{row.relationshipType}</EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <StatusTag label={displayStatus === "NearExpiry" ? "Near expiry" : row.status} kind={statusTagKind(displayStatus)} />
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          {formatIsoUtcForDisplay(row.expirationUtc)}
                          <span className="ms-1 text-al-text-secondary">({formatRelativeExpiry(row.expirationUtc)})</span>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell className="space-x-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setExpandedRowId(expanded ? null : row.connectionId)}>
                            {expanded ? "Hide details" : "Details"}
                          </Button>
                          {row.status === "Active" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={revokingConnectionId != null}
                              onClick={() => setRevokeTarget(row)}
                            >
                              Revoke
                            </Button>
                          ) : (
                            "—"
                          )}
                        </EnterpriseTableCell>
                      </EnterpriseTableRow>
                      {expanded ? (
                        <EnterpriseTableRow key={`${row.connectionId}-details`}>
                          <EnterpriseTableCell colSpan={6}>
                            <dl className="m-0 grid gap-2 md:grid-cols-2">
                              <div>
                                <dt className="font-medium">Rationale</dt>
                                <dd className="m-0 text-al-text-secondary">{row.rationale}</dd>
                              </div>
                              <div>
                                <dt className="font-medium">Evidence reference</dt>
                                <dd className="m-0 text-al-text-secondary">{row.evidenceReference ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="font-medium">Provenance</dt>
                                <dd className="m-0 text-al-text-secondary">{row.provenanceKind}</dd>
                              </div>
                              <div>
                                <dt className="font-medium">Created / updated (UTC)</dt>
                                <dd className="m-0 text-al-text-secondary">
                                  {formatIsoUtcForDisplay(row.createdUtc)} · {formatIsoUtcForDisplay(row.updatedUtc)}
                                </dd>
                              </div>
                            </dl>
                          </EnterpriseTableCell>
                        </EnterpriseTableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          )}
        </section>

        <InfraEvidenceWorkbenchBuildProvenanceStrip testId="infra-declared-connections-build-provenance-limitation" />
      </main>

      <ConfirmationDialog
        open={revokeTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
          }
        }}
        title="Revoke declared connection?"
        description="This removes the HumanAssertion edge from active inventory evidence. The historical row remains for audit."
        confirmLabel="Revoke connection"
        busy={revokingConnectionId != null}
        onConfirm={() => {
          void confirmRevoke();
        }}
        extraContent={
          revokeTarget != null ? (
            <dl className="m-0 grid gap-2 text-sm">
              <div><dt className="font-medium">From</dt><dd className="m-0 font-mono">{revokeTarget.fromCloudResourceId}</dd></div>
              <div><dt className="font-medium">To</dt><dd className="m-0 font-mono">{revokeTarget.toCloudResourceId}</dd></div>
              <div><dt className="font-medium">Type</dt><dd className="m-0">{revokeTarget.relationshipType}</dd></div>
              <div><dt className="font-medium">Expires</dt><dd className="m-0">{formatIsoUtcForDisplay(revokeTarget.expirationUtc)}</dd></div>
            </dl>
          ) : null
        }
      />
    </OperatorPageContainer>
  );
}
