"use client";

import { useEffect, useState } from "react";

import { ArchitectureManifestUnifiedDiffView } from "@/components/compare/ArchitectureManifestUnifiedDiffView";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
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
};

/**
 * Lazy-loads finalized manifest documents and shows a scroll-contained unified JSON line diff.
 */
export function CompareRawManifestDiffSection(props: CompareRawManifestDiffSectionProps) {
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

        const message = err instanceof Error ? err.message : "Manifest diff could not be loaded.";
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
    <details
      id="compare-raw-manifest-diff"
      className={sectionCls}
      data-testid="compare-raw-manifest-diff"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none text-[15px] font-semibold text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
        Manifest diff appendix
      </summary>
      <div className="mt-3 space-y-3">
        <p className="m-0 max-w-prose text-sm text-neutral-700 dark:text-neutral-300">
          Pretty-printed JSON from <strong>GET /v1/authority/runs/…/manifest</strong> for each review. Red and green
          lines are removed or added; unchanged lines provide context around edits.
        </p>

        {loading ? (
          <OperatorLoadingNotice>
            <strong>Loading manifest documents.</strong>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">Fetching both manifests for diff…</p>
          </OperatorLoadingNotice>
        ) : null}

        {errorMessage !== null ? (
          <p className="m-0 text-sm text-red-800 dark:text-red-300" role="alert">
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
  );
}
