"use client";

import Link from "next/link";

import {
  buildFindingDetailSources,
  FINDING_DETAIL_CLAIM_DISCIPLINE,
  FINDING_DETAIL_SOURCES_INTRO,
  FINDING_DETAIL_SOURCES_STATIC,
  type FindingDetailSourceLink,
} from "@/lib/finding-detail-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type Props = {
  readonly runId?: string | null;
  readonly findingId?: string | null;
};

/** Workspace Sources + claim discipline for RRF finding detail. */
export function FindingDetailEvidenceOrientationStrip(props: Props): React.JSX.Element {
  const runId = props.runId?.trim() ?? "";
  const findingId = props.findingId?.trim() ?? "";
  const sources: readonly FindingDetailSourceLink[] =
    runId.length > 0 && findingId.length > 0
      ? buildFindingDetailSources(runId, findingId)
      : FINDING_DETAIL_SOURCES_STATIC;

  return (
    <div className="space-y-3" data-testid="finding-detail-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="finding-detail-sources-heading"
        data-testid="finding-detail-sources"
      >
        <h2
          id="finding-detail-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {FINDING_DETAIL_SOURCES_INTRO}
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
        data-testid="finding-detail-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Single-finding disposition only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{FINDING_DETAIL_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
