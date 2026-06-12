import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";

type GlossaryEntry = {
  readonly term: string;
  readonly definition: string;
};

const CORE_GLOSSARY: GlossaryEntry[] = [
  {
    term: "Architecture review",
    definition:
      "A versioned, evidence-linked analysis package produced by ArchLucid. Contains findings, a signed manifest, and a full audit trail.",
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
    term: "Golden Manifest",
    definition:
      "The signed, immutable summary of a finalized architecture review. Committing the manifest seals the package and triggers governance gates.",
  },
  {
    term: "Policy pack",
    definition:
      "A versioned rule set applied during analysis. Controls which checks run and how findings are classified (e.g. Azure CIS, custom governance).",
  },
  {
    term: "Governance approval",
    definition:
      "An operator or authority decision recorded against a finalized review — Approved, Approved with monitoring, or Rejected. Drives downstream workflow.",
  },
  {
    term: "Audit trail",
    definition:
      "The append-only log of every action taken in this workspace — reviews created, manifests committed, governance decisions recorded.",
  },
  {
    term: "Risk exception",
    definition:
      "A time-bound waiver for an accepted finding. Requires rationale, expiry, and renewal before it expires.",
  },
];

export type ProductConceptsGlossaryProps = {
  readonly entries?: GlossaryEntry[];
  readonly className?: string;
};

/**
 * Collapsed concepts glossary — reduces jargon barrier for first-time ARB
 * reviewers without cluttering the primary review surface.
 */
export function ProductConceptsGlossary({
  entries = CORE_GLOSSARY,
  className,
}: ProductConceptsGlossaryProps): ReactElement {
  return (
    <div className={className}>
      <CollapsibleSection title="Terminology reference" defaultOpen={false}>
        <dl className="m-0 space-y-3 text-sm">
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
