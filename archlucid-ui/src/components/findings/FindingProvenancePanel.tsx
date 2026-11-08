"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { useFindingProvenanceQuery } from "@/hooks/use-finding-provenance-query";
import type { FindingProvenanceStep, FindingProvenanceStepKind } from "@/lib/api/finding-provenance";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  findingProvenancePanelHrefFromSearch,
  parseFindingProvenanceOpenFromSearch,
} from "@/lib/findings/finding-provenance-panel-url";

export type FindingProvenancePanelProps = {
  readonly runId: string;
  readonly findingId: string;
};

function stepKindLabel(kind: FindingProvenanceStepKind): string {
  if (kind === "input") {
    return "Input step";
  }

  if (kind === "evidence") {
    return "Evidence step";
  }

  if (kind === "policy-check") {
    return "Policy check step";
  }

  return "Conclusion step";
}

function stepBorderClass(kind: FindingProvenanceStepKind): string {
  if (kind === "evidence") {
    return "border-l-2 border-neutral-500 pl-3";
  }

  if (kind === "policy-check") {
    return "border-l-2 border-amber-500 pl-3";
  }

  if (kind === "conclusion") {
    return "border-l-2 border-neutral-400 pl-3";
  }

  return "pl-3";
}

export const FINDING_PROVENANCE_STEP_LABEL_NOT_STORED = "Provenance step label was not stored." as const;

export const FINDING_PROVENANCE_STEP_DETAIL_NOT_STORED = "Provenance step detail was not stored." as const;

export const FINDING_PROVENANCE_STEP_LABEL_STORED_EMPTY = "Provenance step label was stored empty." as const;

export const FINDING_PROVENANCE_STEP_DETAIL_STORED_EMPTY = "Provenance step detail was stored empty." as const;

function formatProvenanceStepLabel(label: string | null | undefined): string {
  if (label === null || label === undefined) {
    return FINDING_PROVENANCE_STEP_LABEL_NOT_STORED;
  }

  const trimmed = label.trim();

  return trimmed.length > 0 ? trimmed : FINDING_PROVENANCE_STEP_LABEL_STORED_EMPTY;
}

function formatProvenanceStepDetail(detail: string | null | undefined): string {
  if (detail === null || detail === undefined) {
    return FINDING_PROVENANCE_STEP_DETAIL_NOT_STORED;
  }

  const trimmed = detail.trim();

  return trimmed.length > 0 ? trimmed : FINDING_PROVENANCE_STEP_DETAIL_STORED_EMPTY;
}

function ProvenanceStepRow(props: { readonly step: FindingProvenanceStep }): React.JSX.Element {
  const { step } = props;

  return (
    <li className={cn("space-y-1", stepBorderClass(step.kind))}>
      <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper, step.kind === "conclusion" ? "font-bold" : "")}>
        {stepKindLabel(step.kind)}: {formatProvenanceStepLabel(step.label)}
      </p>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {formatProvenanceStepDetail(step.detail)}
      </p>
    </li>
  );
}

export function FindingProvenancePanel(props: FindingProvenancePanelProps): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const { runId, findingId } = props;
  const [expanded, setExpandedState] = useState(() =>
    parseFindingProvenanceOpenFromSearch(null),
  );
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  const syncExpandedToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        findingProvenancePanelHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setExpanded = useCallback(
    (value: boolean | ((current: boolean) => boolean)) => {
      setExpandedState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (expandedRef.current === next) {
          return current;
        }

        expandedRef.current = next;
        syncExpandedToUrl(next);

        return next;
      });
    },
    [syncExpandedToUrl],
  );

  useEffect(() => {
    const syncExpandedFromUrl = (): void => {
      const next = parseFindingProvenanceOpenFromSearch(
        new URLSearchParams(window.location.search).get("findingProvenanceOpen"),
      );

      if (expandedRef.current === next) {
        return;
      }

      expandedRef.current = next;
      setExpandedState(next);
    };

    syncExpandedFromUrl();
    window.addEventListener("popstate", syncExpandedFromUrl);

    return () => {
      window.removeEventListener("popstate", syncExpandedFromUrl);
    };
  }, []);
  const provenanceQuery = useFindingProvenanceQuery(runId, findingId, { enabled: expanded });
  const loading = expanded && provenanceQuery.isPending;
  const steps = useMemo(() => {
    if (!expanded || provenanceQuery.data === undefined || provenanceQuery.data === null) {
      return null;
    }

    if (provenanceQuery.data.steps.length === 0) {
      return null;
    }

    return provenanceQuery.data.steps;
  }, [expanded, provenanceQuery.data]);
  const error = expanded && !loading && (provenanceQuery.isError || steps === null);

  return (
    <section className="rounded-md border border-neutral-200 dark:border-neutral-700" data-testid="finding-provenance-panel">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded((previous) => !previous);
        }}
      >
        <span className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          How this finding was produced
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-neutral-500 transition-transform", expanded ? "rotate-180" : "")}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          {loading ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
              Loading provenance…
            </p>
          ) : null}

          {error ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
              {provenanceQuery.isError
                ? "Provenance could not be loaded for this finding."
                : "Finding provenance steps were not stored."}
            </p>
          ) : null}

          {!loading && !error && steps !== null ? (
            <ol className="m-0 list-none space-y-3 p-0">
              {steps.map((step, index) => (
                <ProvenanceStepRow key={`${step.kind}-${index}`} step={step} />
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
