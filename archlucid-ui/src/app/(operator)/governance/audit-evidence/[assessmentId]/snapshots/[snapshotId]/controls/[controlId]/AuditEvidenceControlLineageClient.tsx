"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { useAuditEvidenceLineageQuery } from "@/hooks/use-audit-evidence-lineage-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { deriveAuditLineageCheckboxPresentation } from "@/lib/audit-evidence-lineage-presentation";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  auditEvidenceLineageChainHrefFromSearch,
  parseAuditEvidenceLineageChainOpenFromSearch,
} from "@/lib/governance/audit-evidence-lineage-chain-url";

import { AuditEvidenceLineageSpine } from "./AuditEvidenceLineageSpine";

type AuditEvidenceControlLineageClientProps = {
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
};

export function AuditEvidenceControlLineageClient(props: AuditEvidenceControlLineageClientProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const lineageChainOpenParam = searchParams.get("lineageChainOpen");
  const lineageQuery = useAuditEvidenceLineageQuery(props.assessmentId, props.snapshotId, props.controlId);
  const [chainExpanded, setChainExpandedState] = useState(() =>
    parseAuditEvidenceLineageChainOpenFromSearch(lineageChainOpenParam),
  );

  const syncChainExpandedToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        auditEvidenceLineageChainHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setChainExpanded = useCallback(
    (value: boolean | ((current: boolean) => boolean)) => {
      setChainExpandedState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncChainExpandedToUrl(next);

        return next;
      });
    },
    [syncChainExpandedToUrl],
  );

  useEffect(() => {
    setChainExpandedState(parseAuditEvidenceLineageChainOpenFromSearch(lineageChainOpenParam));
  }, [lineageChainOpenParam]);

  const lineage = lineageQuery.data;
  const checkboxPresentation = lineage ? deriveAuditLineageCheckboxPresentation(lineage) : null;

  return (
    <div className="space-y-6 p-4" data-testid="audit-evidence-control-lineage-page">
      <header className="space-y-2">
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          <a className="underline" href={AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}>Audit evidence lineage</a>
        </p>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Audit control evidence lineage</h1>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Chain of custody from control through requirements, evaluation, and collected evidence. Read-only.
        </p>
        <p className={cnMonoIds}>
          assessmentId={props.assessmentId} · snapshotId={props.snapshotId} · controlId={props.controlId}
        </p>
      </header>

      {lineageQuery.isPending ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="audit-evidence-lineage-loading">Loading lineage…</p>
      ) : null}

      {lineageQuery.isError ? (
        <div data-testid="audit-evidence-lineage-error">
          <StatusTag kind="needs-attention" label="Lineage unavailable" />
          <p className={OPERATOR_TYPOGRAPHY.helper}>Could not load chain of custody for this control.</p>
        </div>
      ) : null}

      {lineage ? (
        <>
          <section className="flex flex-wrap items-center gap-3" aria-label="Control support status">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded border border-border bg-card px-3 py-2"
              data-testid="audit-evidence-positive-checkbox"
              aria-expanded={chainExpanded}
              onClick={() => setChainExpanded((value) => !value)}
            >
              <span
                aria-hidden="true"
                className={
                  lineage.readyForPositiveCheckbox
                    ? "text-emerald-600"
                    : "text-muted-foreground line-through"
                }
              >
                ✓
              </span>
              <StatusTag kind={checkboxPresentation!.kind} label={checkboxPresentation!.label} />
            </button>
            <p className={OPERATOR_TYPOGRAPHY.helper}>{checkboxPresentation!.detail}</p>
          </section>

          <AuditEvidenceLineageSpine
            lineage={lineage}
            expanded={chainExpanded || !lineage.readyForPositiveCheckbox}
            lineageContext={{
              assessmentId: props.assessmentId,
              auditEvidenceSnapshotId: props.snapshotId,
              controlId: props.controlId,
            }}
          />
        </>
      ) : null}
    </div>
  );
}

const cnMonoIds = "m-0 font-mono text-xs text-muted-foreground break-all";
