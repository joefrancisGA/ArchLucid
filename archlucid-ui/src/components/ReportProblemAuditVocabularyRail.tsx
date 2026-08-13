"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildReportProblemAuditVocabulary,
  resolveReportProblemAuditPeerLink,
  type ReportProblemAuditSurfaceId,
  type ReportProblemAuditVocabularyModel,
} from "@/lib/vocabulary/report-problem-audit-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ReportProblemAuditVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ReportProblemAuditSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildReportProblemAuditVocabulary}. */
  readonly model?: ReportProblemAuditVocabularyModel;
};

/**
 * TB-2267 — Compact vocabulary rail between Report a problem support intake and Audit trail.
 * Mount on the report-a-problem help topic and the audit page.
 */
export function ReportProblemAuditVocabularyRail(
  props: ReportProblemAuditVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildReportProblemAuditVocabulary();
  const peer = resolveReportProblemAuditPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "report-problem"
      ? model.reportProblemLink
      : model.auditLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="report-problem-audit-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-normal")}
          data-testid="report-problem-audit-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="report-problem-audit-vocabulary-heading"
      data-testid="report-problem-audit-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="report-problem-audit-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-audit-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-audit-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
