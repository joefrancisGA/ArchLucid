import Link from "next/link";

import type { ReactElement } from "react";

import type { FindingInspectEvidence } from "@/types/finding-inspect";

export type FindingInspectEvidenceSectionProps = {
  readonly demoFillGaps: boolean;
  readonly reviewContextHref: string;
  readonly reviewContextLabel: string;
  readonly evidence: FindingInspectEvidence[];
};

function evidencePrimaryText(row: FindingInspectEvidence): string {
  const excerpt = row.excerpt?.trim() ?? "";

  if (excerpt.length > 0) {
    return excerpt;
  }

  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0) {
    return `Artifact reference: ${artifact}`;
  }

  return "Evidence item (no excerpt on file).";
}

function EvidenceExcerptBody({ text }: { readonly text: string }): ReactElement {
  const proseLike = text.includes(" ") && text.length > 24;

  if (proseLike) {
    return <p className="m-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{text}</p>;
  }

  return <span className="font-mono text-xs text-neutral-800 dark:text-neutral-200">{text}</span>;
}

/** Evidence citations / demo scaffold plus links back into review context. */
export function FindingInspectEvidenceSection({
  demoFillGaps,
  reviewContextHref,
  reviewContextLabel,
  evidence,
}: FindingInspectEvidenceSectionProps): ReactElement {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Evidence citations</h2>
      {evidence.length === 0 ? (
        demoFillGaps ? (
          <ul className="mt-2 list-none space-y-3 p-0 text-sm">
            <li className="rounded-md border border-teal-200/80 bg-white/80 p-3 dark:border-teal-900 dark:bg-neutral-900/60">
              <p className="m-0 leading-relaxed text-neutral-800 dark:text-neutral-200">
                Graph citation: <strong>Claims intake API</strong> — request schema includes unredacted member ID and date of
                birth fields referenced by the adjudication subgraph.
              </p>
              <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                Linked in the evidence trail and manifest decision record for this review package.
              </p>
              <div className="mt-2">
                <Link href={reviewContextHref} className="text-xs font-medium text-sky-700 underline dark:text-sky-300">
                  {reviewContextLabel}
                </Link>
              </div>
            </li>
          </ul>
        ) : (
          <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">No related graph citations on file.</p>
        )
      ) : (
        <ul className="mt-2 list-none space-y-3 p-0 text-sm">
          {evidence.map((row, idx) => (
            <li
              key={`${row.excerpt ?? "ev"}-${row.artifactId ?? ""}-${idx}`}
              className="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/60"
            >
              <EvidenceExcerptBody text={evidencePrimaryText(row)} />
              {row.lineRange ? (
                <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">Lines: {row.lineRange}</p>
              ) : null}
              {row.artifactId ? (
                <p className="m-0 mt-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                  Artifact id: {row.artifactId}
                </p>
              ) : null}
              <div className="mt-2">
                <Link href={reviewContextHref} className="text-xs font-medium text-sky-700 underline dark:text-sky-300">
                  {reviewContextLabel}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
