import Link from "next/link";

import {
  comparePairGroundingForRuns,
  comparePairGroundingHasLinks,
  type ComparePairSideGrounding,
} from "@/lib/compare-pair-grounding-links";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ComparePairEvidenceCiteStripProps = {
  readonly baselineRunId: string;
  readonly updatedRunId: string;
};

function SideCiteBlock(props: { readonly side: ComparePairSideGrounding }) {
  const { side } = props;

  return (
    <div data-testid={`compare-pair-cite-${side.sideLabel.toLowerCase()}`}>
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        {side.sideLabel} · {side.runId}
      </p>
      <ul className={cn("m-0 mt-1.5 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {side.links.map((link) => (
          <li key={`${side.sideLabel}-${link.href}`}>
            <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Sponsor-safe pair cites — open review / evidence / search / audit for each compared run. */
export function ComparePairEvidenceCiteStrip(props: ComparePairEvidenceCiteStripProps) {
  const grounding = comparePairGroundingForRuns(props.baselineRunId, props.updatedRunId);

  if (!comparePairGroundingHasLinks(grounding)) {
    return null;
  }

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-labelledby="compare-pair-evidence-cite-heading"
      data-testid="compare-pair-evidence-cite-strip"
    >
      <h3
        id="compare-pair-evidence-cite-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Sources for this comparison
      </h3>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Open the signed review context, evidence trail, or audit trail for each side before treating AI narrative as
        authoritative.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {grounding.baseline !== null ? <SideCiteBlock side={grounding.baseline} /> : null}
        {grounding.updated !== null ? <SideCiteBlock side={grounding.updated} /> : null}
      </div>
    </section>
  );
}
