import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CollapsibleSection } from "@/components/CollapsibleSection";

type GlossaryEntry = {
  readonly term: string;
  readonly definition: string;
};

const CORE_GLOSSARY: GlossaryEntry[] = [
  {
    term: "Architecture review",
    definition:
      "A versioned, evidence-linked analysis package produced by ArchLucid. Contains findings, a sealed review record, and a full audit trail.",
  },
  {
    term: "Finding",
    definition:
      "A policy violation or risk surfaced by an analysis agent. Findings have severity, confidence, recommended actions, and evidence references.",
  },
  {
    term: "Evidence trail",
    definition:
      "The decision-traceability graph linking each finding back through the policy rule, evidence source, and agent reasoning that produced it.",
  },
  {
    term: "Sealed review record",
    definition:
      "The signed, immutable summary of a finalized architecture review. Finalizing the review seals the package and triggers governance gates.",
  },
  {
    term: "Policy pack",
    definition:
      "A versioned rule set applied during analysis. Controls which checks run and how findings are classified (e.g. Azure CIS, custom governance).",
  },
  {
    term: "Governance approval",
    definition:
      "An architect or authority decision recorded against a finalized review — Approved, Approved with monitoring, or Rejected. Drives downstream workflow.",
  },
  {
    term: "Audit trail",
    definition:
      "The append-only log of every action taken in this workspace — reviews created, reviews finalized, governance decisions recorded.",
  },
  {
    term: "Risk exception",
    definition:
      "A time-bound waiver for an accepted finding. Requires rationale, expiry, and renewal before it expires.",
  },
  {
    term: "Execution mode",
    definition:
      "How agents ran for this review — Simulator (deterministic, no model billing) or Real (live Azure OpenAI). Recorded on every package for audit.",
  },
  {
    term: "Replay",
    definition:
      "Re-run authority or policy reasoning against a committed package to see how conclusions would change with updated inputs.",
  },
  {
    term: "Compare",
    definition:
      "Side-by-side diff of two reviews — findings, review record changes, and resolve outcome deltas.",
  },
  {
    term: "Proof packet",
    definition:
      "The exportable evidence bundle (review record hash, audit chain, findings summary) used for sponsor handoff and procurement diligence.",
  },
];

export type ProductConceptsGlossaryProps = {
  readonly entries?: GlossaryEntry[];
  readonly className?: string;
  readonly defaultOpen?: boolean;
};

/**
 * Collapsed concepts glossary — reduces jargon barrier for first-time ARB
 * reviewers without cluttering the primary review surface.
 */
export function ProductConceptsGlossary({
  entries = CORE_GLOSSARY,
  className,
  defaultOpen = false,
}: ProductConceptsGlossaryProps): ReactElement {
  return (
    <div className={className}>
      <CollapsibleSection title="Terminology reference" defaultOpen={defaultOpen}>
        <dl className={cn("m-0 space-y-3", OPERATOR_TYPOGRAPHY.body)}>
          {entries.map((entry) => (
            <div key={entry.term}>
              <dt className="font-semibold text-neutral-800 dark:text-neutral-200">{entry.term}</dt>
              <dd className="mt-0.5 leading-relaxed text-neutral-600 dark:text-neutral-400">{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </CollapsibleSection>
    </div>
  );
}
