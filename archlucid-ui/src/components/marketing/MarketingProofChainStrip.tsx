import type { ReactElement } from "react";

const PROOF_CHAIN_STEPS = [
  "Evidence",
  "Finding",
  "Review record",
  "Artifact",
  "Audit",
] as const;

/** Marketing-safe proof chain — why ArchLucid is not a chat transcript. */
export function MarketingProofChainStrip(): ReactElement {
  return (
    <section
      aria-label="Architecture proof chain"
      className="rounded-xl border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="marketing-proof-chain-strip"
    >
      <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Why this is not a chat answer
      </h2>
      <p className={cn("m-0 mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Each sponsor-facing claim can trace through stored evidence, a finding, a committed review record, an exportable
        artifact, and durable audit metadata — not a disposable LLM thread.
      </p>
      <ol className="m-0 mt-4 flex list-none flex-wrap items-center gap-2 p-0">
        {PROOF_CHAIN_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className={cn("inline-flex rounded-md border border-neutral-300 bg-al-surface-raised px-2 py-1 font-semibold text-al-text-primary dark:border-neutral-600", OPERATOR_TYPOGRAPHY.helper)}>
              {`${index + 1}. ${step}`}
            </span>
            {index < PROOF_CHAIN_STEPS.length - 1 ? (
              <span className={cn("font-medium text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)} aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
