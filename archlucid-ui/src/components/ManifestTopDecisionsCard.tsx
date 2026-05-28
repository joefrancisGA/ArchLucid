import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  SHOWCASE_STATIC_DEMO_DECISION_ITEMS,
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { ManifestSummary } from "@/types/authority";

export type ManifestTopDecisionsCardProps = {
  readonly summary: ManifestSummary;
  /** Buyer-polished shell: shorter headings and reviewer-oriented link labels. */
  readonly buyerPolishedLayout?: boolean;
};

function isShowcaseManifest(summary: ManifestSummary): boolean {
  return (
    summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID ||
    canonicalizeDemoRunId(summary.runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID
  );
}

/**
 * Surfaces actionable decision excerpts for the curated Claims Intake showcase; for other manifests, links onward
 * when decisionCount is non-zero (API does not yet return individual decision bullets on ManifestSummary — see backlog).
 */
export function ManifestTopDecisionsCard(props: ManifestTopDecisionsCardProps) {
  const { summary, buyerPolishedLayout } = props;
  const buyer = buyerPolishedLayout ?? false;

  if (!isShowcaseManifest(summary)) {
    if (summary.decisionCount <= 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {buyer ? "Decisions in this package" : "Architectural decisions"}
          </CardTitle>
          <CardDescription>
            {buyer ? (
              <>
                This review package records <strong>{summary.decisionCount}</strong> decision
                {summary.decisionCount === 1 ? "" : "s"}. Open the review for full context and evidence.
              </>
            ) : (
              <>
                This manifest records <strong>{summary.decisionCount}</strong> decision
                {summary.decisionCount === 1 ? "" : "s"} — review the originating run for full evidence and narration.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reviews/${encodeURIComponent(summary.runId)}#run-explanation`}>
              {buyer ? "View on review" : "Open decisions on run"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (buyer) {
    const sections: { area: string; lines: string[] }[] = [];
    const indexByArea = new Map<string, number>();

    for (const item of SHOWCASE_STATIC_DEMO_DECISION_ITEMS) {
      const existingIdx = indexByArea.get(item.controlArea);

      if (existingIdx === undefined) {
        indexByArea.set(item.controlArea, sections.length);
        sections.push({ area: item.controlArea, lines: [item.text] });
      } else {
        sections[existingIdx]!.lines.push(item.text);
      }
    }

    return (
      <Card id="manifest-key-decisions">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Key decisions</CardTitle>
          <CardDescription>
            Grouped by control area — main architecture choices captured in this review package.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.map((section, idx) => (
            <details key={section.area} open={idx === 0} className="rounded-lg border border-neutral-200 dark:border-neutral-700">
              <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                  {section.area}
                </span>
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  {section.lines.length} decision{section.lines.length === 1 ? "" : "s"}
                </span>
              </summary>
              <ul className="m-0 list-none space-y-2 border-t border-neutral-200 p-3 dark:border-neutral-700">
                {section.lines.map((line) => (
                  <li
                    key={line}
                    className="rounded-md border border-neutral-100 bg-white px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700/60 dark:bg-neutral-900/40 dark:text-neutral-200"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </CardContent>
      </Card>
    );
  }

  const topThree = SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES.slice(0, 3);
  const remainder = SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES.slice(3);

  return (
    <Card id="manifest-key-decisions">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{buyer ? "Key decisions" : "Top decisions"}</CardTitle>
        <CardDescription>
          {buyer
            ? "Main architecture choices captured in this review package."
            : "Preview of key architecture choices captured in this manifest."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="m-0 list-none space-y-2 p-0">
          {topThree.map((line) => (
            <li
              key={line}
              className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200"
            >
              {line}
            </li>
          ))}
        </ul>

        {remainder.length > 0 ? (
          <details className="rounded-md border border-neutral-200 dark:border-neutral-700">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Show all decisions ({SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES.length} total)
            </summary>
            <ul className="m-0 list-none space-y-2 border-t border-neutral-200 p-3 dark:border-neutral-700">
              {remainder.map((line) => (
                <li key={line} className="text-sm text-neutral-700 dark:text-neutral-300">
                  {line}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
