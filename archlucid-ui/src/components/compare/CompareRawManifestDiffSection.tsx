"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

import { ArchitectureManifestUnifiedDiffView } from "@/components/compare/ArchitectureManifestUnifiedDiffView";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import {
  BUYER_COMPARE_MANIFEST_DIFF_APPENDIX_LABEL,
  BUYER_COMPARE_REVIEW_RECORD_DIFF_INTRO,
  BUYER_COMPARE_REVIEW_RECORD_DIFF_LOADING_BODY,
  BUYER_COMPARE_REVIEW_RECORD_DIFF_LOADING_HEADING,
  COMPARE_REVIEW_RECORD_DIFF_OPERATOR_INTRO,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  formatArchitectureManifestJsonForDiff,
  resolveArchitectureManifestJsonForDiff,
} from "@/lib/resolve-architecture-manifest-json-for-diff";
import type { RunSummary } from "@/types/authority";

const sectionCls =
  "mt-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950";

export type CompareRawManifestDiffSectionProps = {
  baselineRunId: string;
  updatedRunId: string;
  baselinePickedSummary?: RunSummary | null;
  updatedPickedSummary?: RunSummary | null;
  buyerPolished?: boolean;
};

/**
 * Lazy-loads finalized manifest documents and shows a scroll-contained unified JSON line diff.
 */
export function CompareRawManifestDiffSection(props: CompareRawManifestDiffSectionProps) {
  const buyerPolished = props.buyerPolished === true || isBuyerPolishedOperatorShellEnv();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [beforeText, setBeforeText] = useState<string | null>(null);
  const [afterText, setAfterText] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function run(): Promise<void> {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [beforeDoc, afterDoc] = await Promise.all([
          resolveArchitectureManifestJsonForDiff(props.baselineRunId),
          resolveArchitectureManifestJsonForDiff(props.updatedRunId),
        ]);

        if (cancelled) {
          return;
        }

        setBeforeText(formatArchitectureManifestJsonForDiff(beforeDoc));
        setAfterText(formatArchitectureManifestJsonForDiff(afterDoc));
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : "Review record diff could not be loaded.";
        setErrorMessage(message);
        setBeforeText(null);
        setAfterText(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [open, props.baselineRunId, props.updatedRunId]);

  const baselineLabel = compareRunHeadingLabel(props.baselineRunId, props.baselinePickedSummary ?? null);
  const updatedLabel = compareRunHeadingLabel(props.updatedRunId, props.updatedPickedSummary ?? null);

  return (
    <section id="compare-raw-manifest-diff" className={sectionCls} data-testid="compare-raw-manifest-diff">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {buyerPolished ? BUYER_COMPARE_MANIFEST_DIFF_APPENDIX_LABEL : "Review record diff appendix"}
      </h2>
      <details
        className="mt-3"
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className={cn("cursor-pointer list-none font-semibold text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden", OPERATOR_TYPOGRAPHY.helper)}>
          {open ? "Hide review record diff" : "Show review record diff"}
        </summary>
      <div className="mt-3 space-y-3">
        <p className={cn("m-0 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolished ? BUYER_COMPARE_REVIEW_RECORD_DIFF_INTRO : COMPARE_REVIEW_RECORD_DIFF_OPERATOR_INTRO}
        </p>

        {loading ? (
          <OperatorLoadingNotice>
            <strong>
              {buyerPolished
                ? BUYER_COMPARE_REVIEW_RECORD_DIFF_LOADING_HEADING
                : `Loading ${SIGNED_MANIFEST_LABEL.toLowerCase()} documents.`}
            </strong>
            <p className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolished
                ? BUYER_COMPARE_REVIEW_RECORD_DIFF_LOADING_BODY
                : "Fetching both review records for diff…"}
            </p>
          </OperatorLoadingNotice>
        ) : null}

        {errorMessage !== null ? (
          <p className={cn("m-0 text-red-800 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {errorMessage}
          </p>
        ) : null}

        {beforeText !== null && afterText !== null && !loading ? (
          <ArchitectureManifestUnifiedDiffView
            baselineLabel={baselineLabel}
            updatedLabel={updatedLabel}
            beforeText={beforeText}
            afterText={afterText}
          />
        ) : null}
      </div>
      </details>
    </section>
  );
}
