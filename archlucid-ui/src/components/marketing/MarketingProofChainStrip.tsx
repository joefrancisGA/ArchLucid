import { cn } from "@/lib/utils";
import type { ReactElement, ReactNode } from "react";

import {
  MARKETING_MOTION,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";

type ProofChainStep = {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactNode;
};

function EvidenceIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h7l3 3v13H7V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4v3h3M9 12h6M9 16h4" />
    </svg>
  );
}

function FindingIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="11" cy="11" r="6" />
      <path strokeLinecap="round" d="M16 16l4 4" />
    </svg>
  );
}

function ReviewRecordIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function ArtifactIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8-4 8 4-8 4-8-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l8 4 8-4M4 16l8 4 8-4" />
    </svg>
  );
}

function AuditIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

const PROOF_CHAIN_STEPS: readonly ProofChainStep[] = [
  { id: "evidence", label: "Evidence", icon: <EvidenceIcon /> },
  { id: "finding", label: "Finding", icon: <FindingIcon /> },
  { id: "review-record", label: "Review record", icon: <ReviewRecordIcon /> },
  { id: "artifact", label: "Artifact", icon: <ArtifactIcon /> },
  { id: "audit", label: "Audit", icon: <AuditIcon /> },
];

/** Marketing-safe proof chain — miniature process diagram, not a badge legend. */
export function MarketingProofChainStrip(): ReactElement {
  return (
    <section
      aria-label="Architecture proof chain"
      className={cn(MARKETING_SURFACES.cardComfort, MARKETING_MOTION.revealIn)}
      data-testid="marketing-proof-chain-strip"
    >
      <h2 className={cn("m-0", MARKETING_TYPOGRAPHY.sectionTitle)}>Why this is not a chat answer</h2>
      <p className={cn("m-0 mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
        Each sponsor-facing claim can trace through stored evidence, a finding, a committed review record, an
        exportable artifact, and durable audit metadata — not a disposable LLM thread.
      </p>
      <ol
        className="m-0 mt-6 flex list-none flex-col items-stretch gap-0 p-0 sm:flex-row sm:items-stretch sm:gap-0"
        data-testid="marketing-proof-chain-pipeline"
      >
        {PROOF_CHAIN_STEPS.map((step, index) => (
          <li key={step.id} className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center">
            <div
              className="flex w-full flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-al-surface-raised px-3 py-5 text-center dark:border-neutral-800"
              data-testid={`marketing-proof-chain-step-${step.id}`}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-md border border-neutral-200 bg-white text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950"
                aria-hidden
              >
                {step.icon}
              </span>
              <span className={cn("font-semibold text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                {index + 1}
              </span>
              <span className={cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
                {step.label}
              </span>
            </div>
            {index < PROOF_CHAIN_STEPS.length - 1 ? (
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center px-0 py-2 font-semibold text-neutral-400 sm:px-2 sm:py-0",
                  MARKETING_TYPOGRAPHY.body,
                )}
                aria-hidden
              >
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
