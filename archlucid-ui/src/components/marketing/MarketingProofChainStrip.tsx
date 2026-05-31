import type { ReactElement } from "react";

const PROOF_CHAIN_STEPS = [
  "Evidence",
  "Finding",
  "Manifest",
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
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
        Why this is not a chat answer
      </h2>
      <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Each sponsor-facing claim can trace through stored evidence, a finding, a committed manifest, an exportable
        artifact, and durable audit metadata — not a disposable LLM thread.
      </p>
      <ol className="m-0 mt-4 flex list-none flex-wrap items-center gap-2 p-0">
        {PROOF_CHAIN_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-md border inline-flex rounded-md border border-neutral-300 bg-al-surface-raised px-2 py-1 text-xs font-semibold text-al-text-primary dark:border-neutral-600">
              {index + 1}. {step}
            </span>
            {index < PROOF_CHAIN_STEPS.length - 1 ? (
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
