import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import {
  MARKETING_MOTION,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";

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
      className={cn(MARKETING_SURFACES.cardComfort, MARKETING_MOTION.revealIn)}
      data-testid="marketing-proof-chain-strip"
    >
      <h2 className={cn("m-0", MARKETING_TYPOGRAPHY.cardTitle)}>Why this is not a chat answer</h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
        Each sponsor-facing claim can trace through stored evidence, a finding, a committed review record, an exportable
        artifact, and durable audit metadata — not a disposable LLM thread.
      </p>
      <ol className="m-0 mt-4 flex list-none flex-wrap items-center gap-2 p-0 lg:flex-nowrap lg:gap-1">
        {PROOF_CHAIN_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className={cn(MARKETING_SURFACES.stepIndicator, MARKETING_TYPOGRAPHY.meta)}>
              {`${index + 1}. ${step}`}
            </span>
            {index < PROOF_CHAIN_STEPS.length - 1 ? (
              <span className={cn("font-medium text-neutral-400", MARKETING_TYPOGRAPHY.meta)} aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
