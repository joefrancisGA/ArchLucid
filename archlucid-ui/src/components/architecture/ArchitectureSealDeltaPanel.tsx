"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { useArchitectureSealDeltaQuery } from "@/hooks/use-architecture-seal-delta-query";
import {
  ARCHITECTURE_SEAL_DELTA_COMPARE_LABEL,
  ARCHITECTURE_SEAL_DELTA_DIFF_COUNT_LABEL,
  ARCHITECTURE_SEAL_DELTA_ERROR_LABEL,
  ARCHITECTURE_SEAL_DELTA_LOADING_LABEL,
  ARCHITECTURE_SEAL_DELTA_PANEL_TITLE,
  ARCHITECTURE_SEAL_DELTA_RETRY_LABEL,
  ARCHITECTURE_SEAL_DELTA_WHAT_IF_LABEL,
  architectureSealDeltaDiffKindLabel,
  architectureSealDeltaSectionLabel,
} from "@/lib/architecture/architecture-seal-delta-copy";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DiffItem } from "@/types/authority-manifest";
import { cn } from "@/lib/utils";

type ArchitectureSealDeltaPanelProps = {
  readonly architectureId: string;
  /** When set on review detail, enables compare against this run when it differs from the sealed baseline. */
  readonly currentReviewRunId?: string | null;
};

function groupDiffsBySection(diffs: readonly DiffItem[]): Map<string, DiffItem[]> {
  const grouped = new Map<string, DiffItem[]>();

  for (const diff of diffs) {
    const section = diff.section?.trim() || "Other";
    const existing = grouped.get(section) ?? [];
    existing.push(diff);
    grouped.set(section, existing);
  }

  return grouped;
}

export function ArchitectureSealDeltaPanel(props: ArchitectureSealDeltaPanelProps): ReactElement {
  const query = useArchitectureSealDeltaQuery(props.architectureId);
  const delta = query.data;

  if (query.isLoading) {
    return (
      <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-300")} data-testid="architecture-seal-delta-loading">
        {ARCHITECTURE_SEAL_DELTA_LOADING_LABEL}
      </p>
    );
  }

  if (query.isError || delta === undefined) {
    return (
      <div className="space-y-2" data-testid="architecture-seal-delta-error">
        <p className={OPERATOR_TYPOGRAPHY.body}>{ARCHITECTURE_SEAL_DELTA_ERROR_LABEL}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
          {ARCHITECTURE_SEAL_DELTA_RETRY_LABEL}
        </Button>
      </div>
    );
  }

  const sealedReviewRunId = delta.latestSealedReviewRunId?.trim() ?? "";
  const currentReviewRunId = props.currentReviewRunId?.trim() ?? "";
  const compareTargetRunId =
    currentReviewRunId.length > 0 && currentReviewRunId !== sealedReviewRunId
      ? currentReviewRunId
      : null;
  const compareHref =
    sealedReviewRunId.length > 0 && compareTargetRunId !== null
      ? comparePageHrefAdaptive(sealedReviewRunId, compareTargetRunId)
      : null;
  const whatIfHref =
    sealedReviewRunId.length > 0 ? `${reviewDetailPath(sealedReviewRunId)}#run-actions` : null;
  const diffCount = delta.diffs.length;
  const groupedDiffs = groupDiffsBySection(delta.diffs);

  return (
    <CollapsibleSection
      title={ARCHITECTURE_SEAL_DELTA_PANEL_TITLE}
      headingLevel={2}
      defaultOpen={diffCount > 0}
      summaryLine={
        diffCount > 0
          ? ARCHITECTURE_SEAL_DELTA_DIFF_COUNT_LABEL(diffCount)
          : delta.emptyStateCopy ?? undefined
      }
      sectionTestId="architecture-seal-delta-panel"
      className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/30"
    >
      <div className="space-y-3 pt-2">
        <p
          className={cn("m-0 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-seal-delta-honesty"
        >
          {delta.honestyCopy}
        </p>

        {delta.emptyStateCopy !== null && delta.emptyStateCopy !== undefined && delta.emptyStateCopy.length > 0 ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-seal-delta-empty">
            {delta.emptyStateCopy}
          </p>
        ) : null}

        {diffCount > 0 ? (
          <div className="space-y-4" data-testid="architecture-seal-delta-diff-list">
            {[...groupedDiffs.entries()].map(([section, items]) => (
              <section key={section} aria-label={architectureSealDeltaSectionLabel(section)}>
                <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                  {architectureSealDeltaSectionLabel(section)}
                </h3>
                <ul className="m-0 list-none space-y-2 p-0">
                  {items.map((item) => (
                    <li
                      key={`${section}:${item.key}:${item.diffKind}`}
                      className="rounded border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-950"
                      data-testid="architecture-seal-delta-row"
                    >
                      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                        {item.key}
                      </p>
                      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                        {architectureSealDeltaDiffKindLabel(item.diffKind)}
                      </p>
                      {item.beforeValue ? (
                        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
                          <span className="font-medium">Sealed:</span> {item.beforeValue}
                        </p>
                      ) : null}
                      {item.afterValue ? (
                        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
                          <span className="font-medium">Draft:</span> {item.afterValue}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {compareHref !== null ? (
            <Link href={compareHref} className={OPERATOR_LINK.nav} data-testid="architecture-seal-delta-compare-link">
              {ARCHITECTURE_SEAL_DELTA_COMPARE_LABEL}
            </Link>
          ) : null}
          {whatIfHref !== null ? (
            <Link href={whatIfHref} className={OPERATOR_LINK.nav} data-testid="architecture-seal-delta-what-if-link">
              {ARCHITECTURE_SEAL_DELTA_WHAT_IF_LABEL}
            </Link>
          ) : null}
        </div>
      </div>
    </CollapsibleSection>
  );
}
