"use client";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import {
  auditEvaluationOutcomeLabel,
  deriveAuditLineageCheckboxPresentation,
} from "@/lib/audit-evidence-lineage-presentation";
import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";

type AuditEvidenceLineageSpineProps = {
  readonly lineage: AuditEvidenceLineageRecord;
  readonly expanded: boolean;
};

function formatUtc(value: string | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function AuditEvidenceLineageSpine(props: AuditEvidenceLineageSpineProps): React.JSX.Element {
  const checkbox = deriveAuditLineageCheckboxPresentation(props.lineage);
  const evaluation = props.lineage.evaluation;

  if (!props.expanded) {
    return (
      <section
        aria-label="Audit evidence lineage summary"
        className="rounded border border-border bg-card p-4"
        data-testid="audit-evidence-lineage-collapsed"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind={checkbox.kind} label={checkbox.label} />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{checkbox.detail}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="audit-evidence-lineage-heading"
      className="rounded border border-border bg-card p-4"
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
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        Deterministic ids only — not an AI determination. Missing links block a positive checkbox.
      </p>

      {(props.lineage.brokenLinkReasons?.length ?? 0) > 0 ? (
        <div
          className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
          data-testid="audit-evidence-broken-link-reasons"
        >
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Broken links</p>
          <ul className="m-0 mt-2 list-disc pl-5">
            {props.lineage.brokenLinkReasons!.map((reason) => (
              <li key={reason} className={OPERATOR_TYPOGRAPHY.helper}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="m-0 mt-4 list-none space-y-4 p-0">
        <li data-testid="audit-evidence-spine-control">
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Audit control</p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
            {props.lineage.controlNumber ?? "—"} · {props.lineage.controlTitle ?? "Untitled control"}
          </p>
          <p className={cn("m-0 mt-1 font-mono text-xs", OPERATOR_TYPOGRAPHY.helper)}>
            controlId={props.lineage.controlId ?? "—"}
          </p>
        </li>

        {evaluation ? (
          <li data-testid="audit-evidence-spine-evaluation">
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Automated evaluation</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusTag kind="neutral" label={auditEvaluationOutcomeLabel(evaluation.outcome)} />
              {evaluation.formula ? (
                <span className={OPERATOR_TYPOGRAPHY.helper}>Formula: {evaluation.formula}</span>
              ) : null}
            </div>
            <p className={cn("m-0 mt-1 font-mono text-xs", OPERATOR_TYPOGRAPHY.helper)}>
              evaluationId={evaluation.evaluationId ?? "—"}
            </p>
            {(evaluation.exceptionIds?.length ?? 0) > 0 ? (
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                Exceptions: {evaluation.exceptionIds!.join(", ")}
              </p>
            ) : null}
            {evaluation.provenanceKind ? (
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                Provenance: {evaluation.provenanceKind}
              </p>
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
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
              Type: {chain.evidenceType ?? "—"} · requirementId={chain.requirementId ?? "—"}
            </p>
            <ul className="m-0 mt-3 list-none space-y-3 p-0">
              {(chain.evidence ?? []).map((evidence) => (
                <li
                  key={evidence.evidenceRowId ?? evidence.azureResourceId ?? evidence.normalizedPointer}
                  className="rounded border border-border p-3"
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
                  <p className={cn("m-0 mt-2 font-mono text-xs break-all", OPERATOR_TYPOGRAPHY.helper)}>
                    evidenceRowId={evidence.evidenceRowId ?? "—"}
                  </p>
                  <p className={cn("m-0 mt-1 font-mono text-xs break-all", OPERATOR_TYPOGRAPHY.helper)}>
                    cloudResourceId={evidence.cloudResourceId ?? "—"}
                  </p>
                  <p className={cn("m-0 mt-1 font-mono text-xs break-all", OPERATOR_TYPOGRAPHY.helper)}>
                    azureResourceId={evidence.azureResourceId ?? "—"}
                  </p>
                  <p className={cn("m-0 mt-1 font-mono text-xs break-all", OPERATOR_TYPOGRAPHY.helper)}>
                    normalizedPointer={evidence.normalizedPointer ?? "—"}
                  </p>
                  <p className={cn("m-0 mt-1 font-mono text-xs break-all", OPERATOR_TYPOGRAPHY.helper)}>
                    rawPointer={evidence.rawPointer ?? "—"}
                  </p>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                    Collected {formatUtc(evidence.collectedUtc)} · collector {evidence.collectorVersion ?? "—"} · selector{" "}
                    {evidence.selectorVersion ?? "—"}
                  </p>
                  {(evidence.missingLinkKinds?.length ?? 0) > 0 ? (
                    <p
                      className={cn("m-0 mt-2 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`audit-evidence-missing-links-${evidence.evidenceRowId}`}
                    >
                      Missing: {evidence.missingLinkKinds!.join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
