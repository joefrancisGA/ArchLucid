"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState, type ReactElement, type SyntheticEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FindingInspectJsonPayload } from "@/components/findings/FindingInspectJsonPayload";
import { getFindingInspect } from "@/lib/api/findings-api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  findingInspectReasoningHrefFromSearch,
  parseFindingInspectReasoningOpenFromSearch,
} from "@/lib/findings/finding-inspect-reasoning-url";

export type FindingInspectReasoningPayloadDetailsProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly reasoningTrace: string | null | undefined;
  /** May be metadata-only (title/rationale) when first paint omitted PayloadJson. */
  readonly typedPayload: unknown;
  /** When true, evaluation dump fetches full typed payload on first expand (TB-931). */
  readonly lazyLoadTypedPayload?: boolean;
};

/** Raw operator traceability — inspect-only; omitted from sponsor-facing finding detail. */
export function FindingInspectReasoningPayloadDetails({
  runId,
  findingId,
  reasoningTrace,
  typedPayload,
  lazyLoadTypedPayload = false,
}: FindingInspectReasoningPayloadDetailsProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingInspectReasoningOpenParam = searchParams.get("findingInspectReasoningOpen");
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const rationaleLabel = buyerPolished ? "Review rationale (technical)" : "View AI Reasoning";
  const evaluationLabel = buyerPolished ? "Structured evaluation record" : "AI Audit Inspection";
  const [reasoningOpen, setReasoningOpenState] = useState(() =>
    parseFindingInspectReasoningOpenFromSearch(findingInspectReasoningOpenParam),
  );

  const syncReasoningOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(findingInspectReasoningHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setReasoningOpen = useCallback(
    (open: boolean) => {
      setReasoningOpenState(open);
      syncReasoningOpenToUrl(open);
    },
    [syncReasoningOpenToUrl],
  );

  useEffect(() => {
    setReasoningOpenState(parseFindingInspectReasoningOpenFromSearch(findingInspectReasoningOpenParam));
  }, [findingInspectReasoningOpenParam]);

  const [resolvedPayload, setResolvedPayload] = useState<unknown>(typedPayload);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error" | "ready">(
    lazyLoadTypedPayload ? "idle" : "ready",
  );

  const onEvaluationToggle = useCallback(
    async (event: SyntheticEvent<HTMLDetailsElement>) => {
      if (!lazyLoadTypedPayload || loadState === "ready" || loadState === "loading") {
        return;
      }

      if (!event.currentTarget.open) {
        return;
      }

      setLoadState("loading");

      try {
        const full = await getFindingInspect(runId, findingId, { includeTypedPayload: true });
        setResolvedPayload(full.typedPayload ?? null);
        setLoadState("ready");
      } catch {
        setLoadState("error");
      }
    },
    [findingId, lazyLoadTypedPayload, loadState, runId],
  );

  return (
    <>
      <details
        className="rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40"
        open={reasoningOpen}
        onToggle={(event) => {
          setReasoningOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
        <summary className={cn("cursor-pointer select-none px-4 py-3 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
          {rationaleLabel}
        </summary>
        <div className="border-t border-neutral-200 px-4 pb-4 pt-2 dark:border-neutral-700">
          {reasoningTrace ? (
            <p className={cn("m-0 whitespace-pre-wrap leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {reasoningTrace}
            </p>
          ) : (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              No rationale trace available for this finding.
            </p>
          )}
        </div>
      </details>

      <details
        className="rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40"
        onToggle={onEvaluationToggle}
      >
        <summary className={cn("cursor-pointer select-none px-4 py-3 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
          {evaluationLabel}
        </summary>
        <div className="border-t border-neutral-200 px-4 pb-4 pt-2 dark:border-neutral-700">
          {loadState === "loading" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading evaluation record…</p>
          ) : null}
          {loadState === "error" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Could not load the full evaluation record. Try again.
            </p>
          ) : null}
          {loadState === "ready" || !lazyLoadTypedPayload ? (
            <FindingInspectJsonPayload value={resolvedPayload ?? null} />
          ) : null}
          {loadState === "idle" && lazyLoadTypedPayload ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Expand to load the full structured evaluation payload.
            </p>
          ) : null}
        </div>
      </details>
    </>
  );
}
