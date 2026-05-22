"use client";

import { useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { getRunDetail } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { coerceRunDetail } from "@/lib/operator-response-guards";
import { extractIacStubForFinding } from "@/lib/quick-decision-summary-derive";

type FindingIacStubPanelProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly initialIacStub?: string | null;
};

/**
 * Collapsible Azure Bicep remediation stub for a finding (from run agent results `iacStub`).
 */
export function FindingIacStubPanel(props: FindingIacStubPanelProps) {
  const [iacStub, setIacStub] = useState<string | null>(
    typeof props.initialIacStub === "string" && props.initialIacStub.trim().length > 0
      ? props.initialIacStub.trim()
      : null,
  );
  const [loaded, setLoaded] = useState(
    typeof props.initialIacStub === "string" && props.initialIacStub.trim().length > 0,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; correlationId: string | null } | null>(null);

  const [hasCopied, setHasCopied] = useState(false);

  async function loadStub(): Promise<void> {
    if (loaded || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const detailEnvelope = await getRunDetail(props.runId);
      const coercedDetail = coerceRunDetail(detailEnvelope.data);

      if (!coercedDetail.ok) {
        setError({ message: coercedDetail.message, correlationId: null });
        setLoaded(true);

        return;
      }

      const stub = extractIacStubForFinding(coercedDetail.value, props.findingId);
      setIacStub(stub);
      setLoaded(true);
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({ message: e.message, correlationId: e.correlationId });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Could not load IaC stub.",
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <CollapsibleSection
      title="Bicep stub"
      defaultOpen={false}
      onToggle={(open) => {
        if (open) {
          void loadStub();
        }
      }}
    >
      {busy ? <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Loading remediation stub…</p> : null}

      {error !== null ? (
        <OperatorApiProblem fallbackMessage={error.message} problem={null} correlationId={error.correlationId} />
      ) : null}

      {loaded && !busy && (iacStub === null || iacStub.length === 0) ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          No IaC stub was generated for this finding. Enable{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">
            AgentRuntime:GenerateIacStubs
          </code>{" "}
          and finalize the review to produce stubs on future runs.
        </p>
      ) : null}

      {iacStub !== null && iacStub.length > 0 ? (
        <div className="space-y-2">
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Minimal Azure Bicep snippet suggested for this finding. Review before applying in your estate.
          </p>
          <pre className="max-h-96 overflow-auto rounded-lg border border-neutral-200 bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:border-neutral-700">
            <code>{iacStub}</code>
          </pre>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(iacStub).then(() => {
                setHasCopied(true);
                setTimeout(() => setHasCopied(false), 2000);
              });
            }}
          >
            {hasCopied ? (
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-500"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </span>
            ) : (
              "Copy to Clipboard"
            )}
          </Button>
        </div>
      ) : null}

      {!loaded && !busy ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => void loadStub()}>
          Load Bicep stub
        </Button>
      ) : null}
    </CollapsibleSection>
  );
}
