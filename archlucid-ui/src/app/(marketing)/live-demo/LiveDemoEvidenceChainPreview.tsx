import {
  LIVE_DEMO_EVIDENCE_CHAIN_HEADING,
  LIVE_DEMO_EVIDENCE_CHAIN_INTRO,
} from "@/lib/live-demo-page-copy";
import { MARKETING_PRIMARY_FILL_CLASS, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { cn } from "@/lib/utils";

type LiveDemoEvidenceChainPreviewProps = {
  readonly payload: DemoCommitPagePreviewResponse;
};

const DEFAULT_CHAIN = [
  "Source evidence — intake context and PHI handling requirements",
  "Policy requirement — healthcare claims governance controls",
  "Finding — PHI minimization risk in shared intake path",
  "Monitored condition — PHI handling controls remain in scope",
  "Governance decision — proceed with monitored remediation",
] as const;

export function LiveDemoEvidenceChainPreview(props: LiveDemoEvidenceChainPreviewProps) {
  const citations = Array.isArray(props.payload.runExplanation?.citations) ? props.payload.runExplanation.citations : [];
  const chain =
    citations.length >= 3
      ? citations.slice(0, 5).map((citation, index) => {
          const label = typeof citation.label === "string" && citation.label.trim().length > 0 ? citation.label.trim() : `Evidence link ${index + 1}`;

          return label;
        })
      : [...DEFAULT_CHAIN];

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="live-demo-evidence-chain-preview"
      role="region"
      aria-labelledby="live-demo-evidence-chain-heading"
    >
      <h3
        id="live-demo-evidence-chain-heading"
        className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}
      >
        {LIVE_DEMO_EVIDENCE_CHAIN_HEADING}
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {LIVE_DEMO_EVIDENCE_CHAIN_INTRO}
      </p>
      <ol className="m-0 mt-4 list-none space-y-0 p-0" aria-label="Evidence chain sequence">
        {chain.map((node, index) => (
          <li key={`${index}-${node}`} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                MARKETING_PRIMARY_FILL_CLASS,
              )}
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pb-3">
              <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.body)}>{node}</p>
              {index < chain.length - 1 ? (
                <span className="mt-1 block text-neutral-400 dark:text-neutral-600" aria-hidden>
                  ↓
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
