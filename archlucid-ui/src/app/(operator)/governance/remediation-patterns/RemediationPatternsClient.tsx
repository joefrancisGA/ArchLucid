"use client";

import { useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  useRemediationPatternDetailQuery,
  useRemediationPatternsQuery,
} from "@/hooks/use-remediation-patterns-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import {
  approveRemediationPatternVersion,
  importRemediationPatternYaml,
  submitRemediationPatternVersion,
} from "@/lib/remediation-pattern-api";
import {
  canApproveRemediationPatternVersion,
  remediationPatternApprovalBlockedReason,
} from "@/lib/remediation-pattern-sod";
import { remediationPatternStatusLabel, REMEDIATION_PATTERN_STATUS } from "@/lib/remediation-pattern-status";
import type { RemediationPatternRecord, RemediationPatternVersionRecord } from "@/lib/remediation-pattern-types";

function VersionHistoryTable(props: {
  readonly versions: ReadonlyArray<RemediationPatternVersionRecord>;
  readonly selectedVersion: string | null;
  readonly onSelectVersion: (version: string) => void;
}) {
  return (
    <EnterpriseTable ariaLabel="Remediation pattern version history">
      <EnterpriseTableHead>
        <EnterpriseTableRow>
          <EnterpriseTableHeaderCell>Version</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Author</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Updated</EnterpriseTableHeaderCell>
        </EnterpriseTableRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.versions.map((version) => (
          <EnterpriseTableRow
            key={version.versionId}
            data-testid={`remediation-pattern-version-${version.version}`}
            onClick={() => props.onSelectVersion(version.version)}
            className={props.selectedVersion === version.version ? "bg-muted/40" : undefined}
          >
            <EnterpriseTableCell>{version.version}</EnterpriseTableCell>
            <EnterpriseTableCell>
              <StatusTag
                kind={version.status === REMEDIATION_PATTERN_STATUS.approved ? "ready" : "neutral"}
                label={remediationPatternStatusLabel(version.status)}
              />
            </EnterpriseTableCell>
            <EnterpriseTableCell>{version.authorActorKey}</EnterpriseTableCell>
            <EnterpriseTableCell>{new Date(version.updatedUtc).toLocaleString()}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

export function RemediationPatternsClient() {
  const listQuery = useRemediationPatternsQuery();
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const detailQuery = useRemediationPatternDetailQuery(selectedPatternId);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [yamlDraft, setYamlDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const canMutate = useOperateCapability();
  const { currentPrincipal } = useOperatorNavAuthority();

  const versions = detailQuery.data?.versions ?? [];

  const activeVersion = useMemo(
    () => versions.find((version) => version.version === selectedVersion) ?? versions[0] ?? null,
    [selectedVersion, versions],
  );

  const approvalBlockedReason = activeVersion
    ? remediationPatternApprovalBlockedReason(activeVersion, currentPrincipal, canMutate)
    : "Select a version under review to approve.";

  const canApprove = activeVersion
    ? canApproveRemediationPatternVersion(activeVersion, currentPrincipal, canMutate)
    : false;

  async function handleImportYaml() {
    setImportError(null);
    setImportSuccess(null);

    if (!yamlDraft.trim()) {
      setImportError("YAML content is required.");
      return;
    }

    try {
      const result = await importRemediationPatternYaml(yamlDraft);

      if (!result.succeeded) {
        setImportError(result.errorMessage ?? "YAML import failed.");
        return;
      }

      setImportSuccess(
        `Imported as Draft${result.patternId ? ` (${result.patternId})` : ""}${result.version ? ` v${result.version}` : ""}. Draft versions cannot be used for production remediation instances.`,
      );
      setYamlDraft("");
      await listQuery.refetch();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "YAML import failed.");
    }
  }

  async function handleSubmit() {
    if (!selectedPatternId || !activeVersion)
      return;

    setActionError(null);

    try {
      const result = await submitRemediationPatternVersion(selectedPatternId, activeVersion.version);

      if (!result.succeeded) {
        setActionError(result.errorMessage ?? "Submit failed.");
        return;
      }

      await detailQuery.refetch();
      await listQuery.refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Submit failed.");
    }
  }

  async function handleApprove() {
    if (!selectedPatternId || !activeVersion || !canApprove)
      return;

    setActionError(null);

    try {
      const result = await approveRemediationPatternVersion(selectedPatternId, activeVersion.version);

      if (!result.succeeded) {
        setActionError(result.errorMessage ?? "Approval failed.");
        return;
      }

      await detailQuery.refetch();
      await listQuery.refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Approval failed.");
    }
  }

  return (
    <div className="space-y-6 p-4" data-testid="remediation-patterns-page">
      <header className="space-y-2">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Remediation patterns</h1>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Create, review, and approve governed remediation patterns. YAML import always lands as Draft and is not eligible for production instances until approved by a different actor.
        </p>
      </header>

      <section className="space-y-3" aria-label="Pattern registry list">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Pattern registry</h2>
        {listQuery.isError ? (
          <StatusTag kind="needs-attention" label="Pattern list unavailable" data-testid="remediation-patterns-list-error" />
        ) : (listQuery.data ?? []).length === 0 ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-empty">
            No remediation patterns yet. Import YAML to create a Draft version.
          </p>
        ) : (
          <EnterpriseTable ariaLabel="Remediation patterns">
            <EnterpriseTableHead>
              <EnterpriseTableRow>
                <EnterpriseTableHeaderCell>Key</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Approved version</EnterpriseTableHeaderCell>
              </EnterpriseTableRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {(listQuery.data ?? []).map((pattern: RemediationPatternRecord) => (
                <EnterpriseTableRow
                  key={pattern.patternId}
                  data-testid={`remediation-pattern-row-${pattern.patternKey}`}
                  onClick={() => {
                    setSelectedPatternId(pattern.patternId);
                    setSelectedVersion(null);
                  }}
                  className={selectedPatternId === pattern.patternId ? "bg-muted/40" : undefined}
                >
                  <EnterpriseTableCell>{pattern.patternKey}</EnterpriseTableCell>
                  <EnterpriseTableCell>{pattern.displayName}</EnterpriseTableCell>
                  <EnterpriseTableCell>{pattern.currentApprovedVersion ?? "—"}</EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        )}
      </section>

      {selectedPatternId ? (
        <section className="space-y-3" aria-label="Version history">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Version history</h2>
          {detailQuery.isError ? (
            <StatusTag kind="needs-attention" label="Version history unavailable" />
          ) : versions.length === 0 ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>No versions found for this pattern.</p>
          ) : (
            <VersionHistoryTable
              versions={versions}
              selectedVersion={activeVersion?.version ?? null}
              onSelectVersion={setSelectedVersion}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border border-border px-3 py-2 text-sm disabled:opacity-50"
              disabled={!canMutate || !activeVersion || activeVersion.status !== REMEDIATION_PATTERN_STATUS.draft}
              onClick={handleSubmit}
            >
              Submit for review
            </button>
            <button
              type="button"
              className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              disabled={!canApprove}
              title={approvalBlockedReason ?? undefined}
              data-testid="remediation-pattern-approve-button"
              onClick={handleApprove}
            >
              Approve version
            </button>
          </div>
          {approvalBlockedReason && activeVersion?.status === REMEDIATION_PATTERN_STATUS.underReview ? (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-pattern-approval-blocked-reason">
              {approvalBlockedReason}
            </p>
          ) : null}
          {actionError ? <StatusTag kind="needs-attention" label={actionError} /> : null}
        </section>
      ) : null}

      <section className="space-y-3 rounded border border-dashed border-border p-4" aria-label="YAML import">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>YAML import</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Imports create Draft versions only. They are not usable for production remediation instances until reviewed and approved.
        </p>
        <textarea
          className="min-h-32 w-full rounded border border-border bg-background p-3 font-mono text-xs"
          value={yamlDraft}
          onChange={(event) => setYamlDraft(event.target.value)}
          placeholder="Paste remediation pattern YAML…"
          data-testid="remediation-pattern-yaml-input"
        />
        <button
          type="button"
          className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={!canMutate}
          onClick={handleImportYaml}
        >
          Import YAML as Draft
        </button>
        {importError ? (
          <StatusTag kind="needs-attention" label={importError} data-testid="remediation-pattern-import-error" />
        ) : null}
        {importSuccess ? (
          <StatusTag kind="ready" label={importSuccess} data-testid="remediation-pattern-import-success" />
        ) : null}
      </section>
    </div>
  );
}
