import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

/** Retired internal-runbook slugs folded into canonical scored help routes (Batch R). */
export const FOLDED_INTERNAL_RUNBOOK_SLUGS = [
  "first-review",
  "first-value-20-minutes",
] as const;

export type FoldedInternalRunbookSlug = (typeof FOLDED_INTERNAL_RUNBOOK_SLUGS)[number];

const FOLDED_INTERNAL_RUNBOOK_ENTRIES: readonly ProductDocumentationEntry[] = [
  {
    slug: "first-review",
    title: "First-run evidence checklist (internal runbook)",
    summary:
      "Admin/SE printable Tier-1 evidence checklist with specialty CTAs to Your first architecture review, Start architecture review, and audit. Customer architects should use those buyer paths instead.",
    audience: "operator",
    sourcePaths: ["docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md"],
    sectionAnchors: ["printable-first-run-evidence-checklist"],
    contentKind: "internal-runbook",
    pdfStatus: null,
  },
  {
    slug: "first-value-20-minutes",
    title: "First value in 20 minutes (Admin runbook)",
    summary:
      "Admin-only SE/ops checklist for time-boxed first value when platform wiring is already green. Customer architects should use Your first architecture review instead.",
    audience: "operator",
    sourcePaths: ["docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md"],
    sectionAnchors: ["first-value-in-20-minutes"],
    lastReviewed: "2026-08-09",
    releaseApplicability: "Admin SE time-boxed first-value proof path",
    contentKind: "internal-runbook",
    pdfStatus: null,
  },
] as const;

const foldedBySlug = new Map(
  FOLDED_INTERNAL_RUNBOOK_ENTRIES.map((entry) => [entry.slug, entry]),
);

export function isFoldedInternalRunbookSlug(slug: string): slug is FoldedInternalRunbookSlug {
  return foldedBySlug.has(slug);
}

export function getFoldedInternalRunbookEntry(slug: string): ProductDocumentationEntry | null {
  return foldedBySlug.get(slug) ?? null;
}
