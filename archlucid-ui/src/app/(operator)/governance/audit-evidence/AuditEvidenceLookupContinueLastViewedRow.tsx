"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AUDIT_EVIDENCE_LOOKUP_CONTINUE_LAST_ACTION,
  AUDIT_EVIDENCE_LOOKUP_CONTINUE_LAST_PREFILL_ACTION,
  AUDIT_EVIDENCE_LOOKUP_CONTINUE_LAST_TITLE,
} from "@/lib/audit-evidence-page-copy";
import { OPERATOR_RESUME, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ContinueLastAuditEvidenceLineageTarget } from "@/lib/resolve-continue-last-audit-evidence-lineage";
import { cn } from "@/lib/utils";

export type AuditEvidenceLookupContinueLastViewedRowProps = {
  readonly target: ContinueLastAuditEvidenceLineageTarget;
  readonly onPrefill: () => void;
};

/** Resume the most recent audit evidence control lineage visit from operator recent views. */
export function AuditEvidenceLookupContinueLastViewedRow(
  props: AuditEvidenceLookupContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="audit-evidence-lookup-continue-last-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="audit-evidence-lookup-continue-last-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="audit-evidence-lookup-continue-last-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            {AUDIT_EVIDENCE_LOOKUP_CONTINUE_LAST_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.label}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="audit-evidence-lookup-continue-last-prefill"
            onClick={props.onPrefill}
          >
            {AUDIT_EVIDENCE_LOOKUP_CONTINUE_LAST_PREFILL_ACTION}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            asChild
            data-testid="audit-evidence-lookup-continue-last-open"
          >
            <Link href={props.target.href}>{AUDIT_EVIDENCE_LOOKUP_CONTINUE_LAST_ACTION}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
