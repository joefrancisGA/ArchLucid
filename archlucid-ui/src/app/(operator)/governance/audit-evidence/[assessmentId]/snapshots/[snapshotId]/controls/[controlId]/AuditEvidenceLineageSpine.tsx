"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  auditEvaluationOutcomeLabel,
  deriveAuditLineageCheckboxPresentation,
} from "@/lib/audit-evidence-lineage-presentation";
import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";
import { buildResourceHubAuditLineageHref } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import { formatResourceHubTabViewLabel } from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import {
  AUDIT_EVIDENCE_LINEAGE_SPINE_TECHNICAL_OPEN_PARAM,
  auditEvidenceLineageSpineTechnicalDisclosureHrefFromSearch,
  parseAuditEvidenceLineageSpineTechnicalOpenFromSearch,
} from "@/lib/governance/audit-evidence-lineage-spine-technical-disclosure-url";
import {
  AUDIT_EVIDENCE_SPINE_EVIDENCE_TECHNICAL_ROW_ID_PARAM,
  auditEvidenceSpineEvidenceTechnicalDisclosureHrefFromSearch,
  parseAuditEvidenceSpineEvidenceTechnicalRowIdFromSearch,
} from "@/lib/governance/audit-evidence-spine-evidence-technical-disclosure-url";

type AuditEvidenceLineageSpineProps = {
  readonly lineage: AuditEvidenceLineageRecord;
  readonly expanded: boolean;
  readonly buyerPolishedShell?: boolean;
  readonly lineageContext: {
    readonly assessmentId: string;
    readonly auditEvidenceSnapshotId: string;
    readonly controlId: string;
  };
};

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnBrokenLinksPanel =
  "mt-4 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/40";

function formatUtc(value: string | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function TechnicalIdentifierRow(props: { readonly label: string; readonly value: string | null | undefined }): React.JSX.Element {
  return (
    <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
      {props.label}={props.value ?? "—"}
    </p>
  );
}

export function AuditEvidenceLineageSpine(props: AuditEvidenceLineageSpineProps): React.JSX.Element {
  const checkbox = deriveAuditLineageCheckboxPresentation(props.lineage);
  const evaluation = props.lineage.evaluation;
  const buyerPolishedShell = props.buyerPolishedShell ?? false;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const spineTechnicalOpenParam = searchParams.get(AUDIT_EVIDENCE_LINEAGE_SPINE_TECHNICAL_OPEN_PARAM);
  const spineEvidenceTechnicalRowIdParam = searchParams.get(AUDIT_EVIDENCE_SPINE_EVIDENCE_TECHNICAL_ROW_ID_PARAM);
  const [spineTechnicalOpen, setSpineTechnicalOpenState] = useState(() =>
    parseAuditEvidenceLineageSpineTechnicalOpenFromSearch(spineTechnicalOpenParam),
  );
  const [spineEvidenceTechnicalRowId, setSpineEvidenceTechnicalRowIdState] = useState(() =>
    parseAuditEvidenceSpineEvidenceTechnicalRowIdFromSearch(spineEvidenceTechnicalRowIdParam),
  );

  const syncSpineTechnicalOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        auditEvidenceLineageSpineTechnicalDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSpineTechnicalOpen = useCallback(
    (open: boolean) => {
      setSpineTechnicalOpenState(open);
      syncSpineTechnicalOpenToUrl(open);
    },
    [syncSpineTechnicalOpenToUrl],
  );

  const syncSpineEvidenceTechnicalRowIdToUrl = useCallback(
    (evidenceRowId: string | null) => {
      router.replace(
        auditEvidenceSpineEvidenceTechnicalDisclosureHrefFromSearch(searchParams.toString(), evidenceRowId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSpineEvidenceTechnicalRowId = useCallback(
    (evidenceRowId: string | null) => {
      setSpineEvidenceTechnicalRowIdState(evidenceRowId);
      syncSpineEvidenceTechnicalRowIdToUrl(evidenceRowId);
    },
    [syncSpineEvidenceTechnicalRowIdToUrl],
  );

  useEffect(() => {
    setSpineTechnicalOpenState(parseAuditEvidenceLineageSpineTechnicalOpenFromSearch(spineTechnicalOpenParam));
  }, [spineTechnicalOpenParam]);

  useEffect(() => {
    setSpineEvidenceTechnicalRowIdState(
      parseAuditEvidenceSpineEvidenceTechnicalRowIdFromSearch(spineEvidenceTechnicalRowIdParam),
    );
  }, [spineEvidenceTechnicalRowIdParam]);

  if (!props.expanded) {
    return (
      <section
        aria-label="Audit evidence lineage summary"
        className={cnCard}
        data-testid="audit-evidence-lineage-collapsed"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind={checkbox.kind} label={checkbox.label} />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{checkbox.detail}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="audit-evidence-lineage-heading"
      className={cnCard}
      data-testid="audit-evidence-lineage-spine"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="audit-evidence-lineage-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Chain of custody
        </h2>
        <StatusTag kind={checkbox.kind} label={checkbox.label} />
        <StatusTag
          kind={props.lineage.snapshotHashVerified ? "ready" : "needs-attention"}
          label={props.lineage.snapshotHashVerified ? "Snapshot hash verified" : "Snapshot hash unverified"}
        />
      </div>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Deterministic linkage only — not an AI determination. Missing links block a positive checkbox.
      </p>

      {(props.lineage.brokenLinkReasons?.length ?? 0) > 0 ? (
        <div className={cnBrokenLinksPanel} data-testid="audit-evidence-broken-link-reasons">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind="needs-attention" label="Broken links" />
          </div>
          <ul className="m-0 mt-2 list-disc pl-5 text-al-text-secondary">
            {props.lineage.brokenLinkReasons!.map((reason) => (
              <li key={reason} className={OPERATOR_TYPOGRAPHY.helper}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="m-0 mt-4 list-none space-y-4 p-0">
        <li data-testid="audit-evidence-spine-control">
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Audit control</p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {props.lineage.controlNumber ?? "—"} · {props.lineage.controlTitle ?? "Untitled control"}
          </p>
          {!buyerPolishedShell ? (
            <TechnicalIdentifierRow label="controlId" value={props.lineage.controlId} />
          ) : null}
        </li>

        {evaluation ? (
          <li data-testid="audit-evidence-spine-evaluation">
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Automated evaluation</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusTag kind="neutral" label={auditEvaluationOutcomeLabel(evaluation.outcome)} />
              {evaluation.formula ? (
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Formula: {evaluation.formula}
                </span>
              ) : null}
            </div>
            {!buyerPolishedShell ? (
              <>
                <TechnicalIdentifierRow label="evaluationId" value={evaluation.evaluationId} />
                {(evaluation.exceptionIds?.length ?? 0) > 0 ? (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Exceptions: {evaluation.exceptionIds!.join(", ")}
                  </p>
                ) : null}
                {evaluation.provenanceKind ? (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Provenance: {evaluation.provenanceKind}
                  </p>
                ) : null}
              </>
            ) : null}
          </li>
        ) : (
          <li data-testid="audit-evidence-spine-evaluation-missing">
            <StatusTag kind="needs-attention" label="Evaluation missing" />
          </li>
        )}

        {(props.lineage.requirementChains ?? []).map((chain) => (
          <li key={chain.requirementId ?? chain.requirementName} data-testid={`audit-evidence-spine-requirement-${chain.requirementId}`}>
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>
              Evidence requirement · {chain.requirementName ?? "Unnamed"}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Type: {chain.evidenceType ?? "—"}
              {!buyerPolishedShell ? ` · requirementId=${chain.requirementId ?? "—"}` : null}
            </p>
            <ul className="m-0 mt-3 list-none space-y-3 p-0">
              {(chain.evidence ?? []).map((evidence) => (
                <li
                  key={evidence.evidenceRowId ?? evidence.azureResourceId ?? evidence.normalizedPointer}
                  className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                  data-testid={`audit-evidence-spine-evidence-${evidence.evidenceRowId}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusTag
                      kind={evidence.linkComplete && evidence.itemHashVerified ? "ready" : "needs-attention"}
                      label={evidence.linkComplete && evidence.itemHashVerified ? "Link complete" : "Link broken"}
                    />
                    {!evidence.itemHashVerified ? (
                      <StatusTag kind="needs-attention" label="Hash failed" />
                    ) : null}
                  </div>
                  {evidence.cloudResourceId != null && evidence.cloudResourceId.trim().length > 0 ? (
                    <Link
                      className={cn("mt-2 inline-block", OPERATOR_LINK.inline)}
                      href={buildResourceHubAuditLineageHref(evidence.cloudResourceId, props.lineageContext)}
                      data-testid={`audit-evidence-spine-resource-hub-${evidence.evidenceRowId}`}
                    >
                      {formatResourceHubTabViewLabel("audit")}
                    </Link>
                  ) : null}
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Collected {formatUtc(evidence.collectedUtc)} · collector {evidence.collectorVersion ?? "—"} · selector{" "}
                    {evidence.selectorVersion ?? "—"}
                  </p>
                  {(evidence.missingLinkKinds?.length ?? 0) > 0 ? (
                    <p
                      className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`audit-evidence-missing-links-${evidence.evidenceRowId}`}
                    >
                      Missing: {evidence.missingLinkKinds!.join(", ")}
                    </p>
                  ) : null}
                  {buyerPolishedShell ? (
                    <CollapsibleSection
                      title="Technical identifiers"
                      sectionTestId={`audit-evidence-spine-evidence-technical-${evidence.evidenceRowId}`}
                      summaryLine="Evidence row and cloud resource IDs"
                      open={spineEvidenceTechnicalRowId === (evidence.evidenceRowId ?? "")}
                      onToggle={(open) => {
                        setSpineEvidenceTechnicalRowId(open ? (evidence.evidenceRowId ?? "") : null);
                      }}
                    >
                      <TechnicalIdentifierRow label="evidenceRowId" value={evidence.evidenceRowId} />
                      <TechnicalIdentifierRow label="cloudResourceId" value={evidence.cloudResourceId} />
                      <TechnicalIdentifierRow label="azureResourceId" value={evidence.azureResourceId} />
                      <TechnicalIdentifierRow label="normalizedPointer" value={evidence.normalizedPointer} />
                      <TechnicalIdentifierRow label="rawPointer" value={evidence.rawPointer} />
                    </CollapsibleSection>
                  ) : (
                    <>
                      <TechnicalIdentifierRow label="evidenceRowId" value={evidence.evidenceRowId} />
                      <TechnicalIdentifierRow label="cloudResourceId" value={evidence.cloudResourceId} />
                      <TechnicalIdentifierRow label="azureResourceId" value={evidence.azureResourceId} />
                      <TechnicalIdentifierRow label="normalizedPointer" value={evidence.normalizedPointer} />
                      <TechnicalIdentifierRow label="rawPointer" value={evidence.rawPointer} />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {buyerPolishedShell ? (
        <CollapsibleSection
          title="Technical identifiers"
          sectionTestId="audit-evidence-spine-technical-identifiers"
          summaryLine="Control and evaluation IDs for API integrations"
          open={spineTechnicalOpen}
          onToggle={setSpineTechnicalOpen}
        >
          <TechnicalIdentifierRow label="controlId" value={props.lineage.controlId} />
          {evaluation ? (
            <>
              <TechnicalIdentifierRow label="evaluationId" value={evaluation.evaluationId} />
              {(evaluation.exceptionIds?.length ?? 0) > 0 ? (
                <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Exceptions: {evaluation.exceptionIds!.join(", ")}
                </p>
              ) : null}
              {evaluation.provenanceKind ? (
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Provenance: {evaluation.provenanceKind}
                </p>
              ) : null}
            </>
          ) : null}
        </CollapsibleSection>
      ) : null}
    </section>
  );
}
