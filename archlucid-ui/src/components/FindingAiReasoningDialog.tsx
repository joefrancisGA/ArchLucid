"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FindingWireSnapshot } from "@/lib/quick-decision-summary-derive";

export type FindingAiReasoningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findingId: string | null;
  /** Finding title or message shown in the dialog header. */
  findingTitle: string;
  /** Null when the run response has no matching ArchitectureFinding payload. */
  snapshot: FindingWireSnapshot | null;
};

function parseWireForKeyFields(
  wireJson: string,
): { evaluationConfidenceScore?: unknown; confidenceLevel?: unknown; evidenceRefs?: unknown } | null {
  try {
    const parsed: unknown = JSON.parse(wireJson);

    if (parsed === null || typeof parsed !== "object") {
      return null;
    }

    const o = parsed as Record<string, unknown>;

    return {
      evaluationConfidenceScore: o.evaluationConfidenceScore,
      confidenceLevel: o.confidenceLevel,
      evidenceRefs: o.evidenceRefs,
    };
  } catch {
    return null;
  }
}

/**
 * Opt-in modal: raw ArchitectureFinding JSON (Staged Critic fields included when the API emits them) + reasoning trace.
 */
export function FindingAiReasoningDialog(props: FindingAiReasoningDialogProps): ReactElement {
  const { open, onOpenChange, findingId, findingTitle, snapshot } = props;

  const trimmedId = findingId?.trim() ?? "";
  const keys = snapshot !== null ? parseWireForKeyFields(snapshot.wireJson) : null;
  const evidenceList = Array.isArray(keys?.evidenceRefs) ? (keys.evidenceRefs as unknown[]) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
        aria-labelledby="finding-ai-reasoning-title"
        aria-describedby="finding-ai-reasoning-desc"
      >
        <DialogHeader>
          <DialogTitle id="finding-ai-reasoning-title">View AI reasoning</DialogTitle>
          <DialogDescription id="finding-ai-reasoning-desc">
            Raw evaluation payload from the run detail finding record — confidence, evidence refs, and reasoning trace as
            returned by the API (additional Staged Critic metadata appears here when persisted).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200">
          {trimmedId.length > 0 ? (
            <p className="m-0">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Finding id:</span>{" "}
              <span className="font-mono text-xs">{trimmedId}</span>
            </p>
          ) : null}

          {findingTitle.trim().length > 0 ? (
            <p className="m-0 text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Title:</span> {findingTitle}
            </p>
          ) : null}

          {snapshot === null ? (
            <p className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 m-0 p-3">
              No finding payload was available on this run response. Open <strong>View trace</strong> for persisted
              explainability, or inspect the finding page after the pipeline persists full results.
            </p>
          ) : (
            <>
              {keys !== null &&
              (keys.evaluationConfidenceScore !== undefined ||
                keys.confidenceLevel !== undefined ||
                evidenceList.length > 0) ? (
                <section
                  aria-labelledby="ai-reasoning-confidence-heading"
                  className="rounded-md border border-neutral-200 bg-neutral-50/90 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
                >
                  <h3
                    id="ai-reasoning-confidence-heading"
                    className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
                  >
                    Evaluation signals
                  </h3>
                  <dl className="m-0 mt-2 space-y-1.5 text-xs">
                    {keys.evaluationConfidenceScore !== undefined && keys.evaluationConfidenceScore !== null ? (
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="font-semibold text-neutral-700 dark:text-neutral-300">evaluationConfidenceScore</dt>
                        <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">
                          {String(keys.evaluationConfidenceScore)}
                        </dd>
                      </div>
                    ) : null}
                    {keys.confidenceLevel !== undefined && keys.confidenceLevel !== null ? (
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="font-semibold text-neutral-700 dark:text-neutral-300">confidenceLevel</dt>
                        <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">
                          {String(keys.confidenceLevel)}
                        </dd>
                      </div>
                    ) : null}
                    {evidenceList.length > 0 ? (
                      <div>
                        <dt className="font-semibold text-neutral-700 dark:text-neutral-300">evidenceRefs</dt>
                        <dd className="m-0 mt-0.5">
                          <ul className="m-0 list-disc space-y-0.5 pl-5 font-mono text-[11px]">
                            {evidenceList.map((ref, i) => (
                              <li key={`${String(ref)}-${i}`}>{String(ref)}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              ) : null}

              {snapshot.reasoningTrace.trim().length > 0 ? (
                <section aria-labelledby="ai-reasoning-trace-heading">
                  <h3 id="ai-reasoning-trace-heading" className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    Reasoning trace
                  </h3>
                  <pre className="mt-2 max-h-[min(40vh,22rem)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950/80 dark:text-neutral-100">
                    <code className="whitespace-pre-wrap break-words font-mono">{snapshot.reasoningTrace}</code>
                  </pre>
                </section>
              ) : null}

              <section aria-labelledby="ai-reasoning-raw-heading">
                <h3 id="ai-reasoning-raw-heading" className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  Raw finding JSON
                </h3>
                <pre className="mt-2 max-h-[min(50vh,28rem)] overflow-auto rounded-md border border-neutral-200 bg-neutral-950 p-3 text-[11px] leading-snug text-emerald-100 dark:border-neutral-700">
                  <code className="whitespace-pre-wrap break-all font-mono">{snapshot.wireJson}</code>
                </pre>
              </section>
            </>
          )}

          <div className="flex justify-end border-t border-neutral-200 pt-3 dark:border-neutral-700">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
