"use client";

import { useId, useMemo, useState } from "react";

import { useFindingLlmAuditQuery } from "@/hooks/use-finding-llm-audit-query";
import { useFindingProvenanceQuery } from "@/hooks/use-finding-provenance-query";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { buildFindingRawContextBlocks } from "@/lib/build-finding-raw-context-blocks";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingInspectContextDebugPanelProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly inspectPayload: FindingInspectPayload;
};

function blockBorderClass(kind: ReturnType<typeof buildFindingRawContextBlocks>[number]["kind"]): string {
  if (kind === "cited-evidence") {
    return "border-l-2 border-teal-500 pl-3";
  }

  if (kind === "provenance-evidence") {
    return "border-l-2 border-teal-600 pl-3";
  }

  if (kind === "provenance-input") {
    return "border-l-2 border-neutral-400 pl-3";
  }

  return "border-l-2 border-violet-500 pl-3";
}

/** Operator debug toggle: cited evidence, provenance context, and redacted LLM user prompt. */
export function FindingInspectContextDebugPanel(props: FindingInspectContextDebugPanelProps): React.JSX.Element {
  const { runId, findingId, inspectPayload } = props;
  const toggleId = useId();
  const [enabled, setEnabled] = useState(false);
  const trimmedFindingId = findingId.trim();
  const provenanceQuery = useFindingProvenanceQuery(runId, trimmedFindingId, { enabled });
  const llmAuditQuery = useFindingLlmAuditQuery(runId, trimmedFindingId, { enabled });
  const loading = enabled && (provenanceQuery.isPending || llmAuditQuery.isPending);
  const failure: ApiLoadFailureState | null = useMemo(
    () => (provenanceQuery.isError ? toApiLoadFailure(provenanceQuery.error) : null),
    [provenanceQuery.error, provenanceQuery.isError],
  );
  const provenance = provenanceQuery.data ?? null;
  const llmAudit = llmAuditQuery.isError ? null : (llmAuditQuery.data ?? null);

  const blocks = useMemo(
    () => buildFindingRawContextBlocks(inspectPayload, provenance, llmAudit),
    [inspectPayload, llmAudit, provenance],
  );

  return (
    <section
      className="rounded-md border border-neutral-200 dark:border-neutral-700"
      data-testid="finding-inspect-context-debug-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="space-y-1">
          <label
            htmlFor={toggleId}
            className={cn(OPERATOR_TYPOGRAPHY.badge, "font-semibold text-neutral-800 dark:text-neutral-100")}
          >
            Evidence trace detail
          </label>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Shows the evidence excerpts and analysis context used to produce this finding.
          </p>
        </div>
        <input
          id={toggleId}
          type="checkbox"
          className="h-4 w-4 shrink-0 accent-teal-700"
          checked={enabled}
          onChange={(event) => {
            setEnabled(event.target.checked);
          }}
        />
      </div>

      {enabled ? (
        <div
          id="finding-inspect-context-debug-body"
          className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700"
        >
          {loading ? (
            <ul className="m-0 list-none space-y-2 p-0">
              <li className="h-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <li className="h-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </ul>
          ) : null}

          {!loading && failure !== null ? (
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
            />
          ) : null}

          {!loading && failure === null && blocks.length === 0 ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              No raw context blocks are available for this finding yet.
            </p>
          ) : null}

          {!loading && failure === null && blocks.length > 0 ? (
            <ol className="m-0 list-none space-y-4 p-0">
              {blocks.map((block) => (
                <li key={block.id} className={cn("space-y-2", blockBorderClass(block.kind))}>
                  <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                    {block.title}
                  </p>
                  {block.meta !== null ? (
                    <p className="m-0 font-mono text-[0.65rem] text-neutral-500 dark:text-neutral-400">{block.meta}</p>
                  ) : null}
                  <pre className={cn("m-0 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-3 leading-relaxed text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
                    {block.body}
                  </pre>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
