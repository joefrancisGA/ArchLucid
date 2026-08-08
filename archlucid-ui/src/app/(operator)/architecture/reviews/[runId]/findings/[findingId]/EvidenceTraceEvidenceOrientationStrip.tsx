"use client";

import Link from "next/link";

import {
  buildEvidenceTraceSources,
  EVIDENCE_TRACE_CLAIM_DISCIPLINE,
  EVIDENCE_TRACE_SOURCES_INTRO,
  EVIDENCE_TRACE_SOURCES_STATIC,
  type EvidenceTraceSourceLink,
} from "@/lib/evidence-trace-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type Props = {
  readonly runId?: string | null;
  readonly findingId?: string | null;
};

/** Workspace Sources + claim discipline for ERU evidence-trace. */
export function EvidenceTraceEvidenceOrientationStrip(props: Props): React.JSX.Element {
  const runId = props.runId?.trim() ?? "";
  const findingId = props.findingId?.trim() ?? "";
  const sources: readonly EvidenceTraceSourceLink[] =
    runId.length > 0 && findingId.length > 0
      ? buildEvidenceTraceSources(runId, findingId)
      : EVIDENCE_TRACE_SOURCES_STATIC;

  return (
    <div className="space-y-3" data-testid="evidence-trace-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="evidence-trace-sources-heading"
        data-testid="evidence-trace-sources"
      >
        <h2
          id="evidence-trace-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {EVIDENCE_TRACE_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {sources.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="evidence-trace-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Single-finding trace only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{EVIDENCE_TRACE_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
