import Link from "next/link";

import type { ReactElement } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { FindingInspectEvidence } from "@/types/finding-inspect";

export type FindingInspectEvidenceSectionProps = {
  readonly demoFillGaps: boolean;
  readonly reviewContextHref: string;
  readonly reviewContextLabel: string;
  readonly evidence: FindingInspectEvidence[];
};

function evidenceCitationTitle(row: FindingInspectEvidence): string {
  const excerpt = row.excerpt?.trim() ?? "";

  if (excerpt.length > 0) {
    const firstClause = excerpt.split(/[.—]/)[0]?.trim() ?? excerpt;

    if (firstClause.length > 0 && firstClause.length <= 80) {
      return firstClause;
    }

    return excerpt.length > 80 ? `${excerpt.slice(0, 77)}…` : excerpt;
  }

  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0) {
    return artifact.replace(/-/g, " ");
  }

  return "Cited evidence";
}

function evidenceLinkLabel(row: FindingInspectEvidence, fallbackLabel: string): string {
  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0) {
    return `Open ${artifact}`;
  }

  return fallbackLabel;
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
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Evidence citations</h2>
      {evidence.length === 0 ? (
        demoFillGaps ? (
          <ul className="mt-2 list-none space-y-3 p-0 text-sm">
            <li className="rounded-md border border-teal-200/80 bg-white/80 p-3 dark:border-teal-900 dark:bg-neutral-900/60">
              <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Claims intake API schema</p>
              <p className="m-0 mt-2 leading-relaxed text-neutral-800 dark:text-neutral-200">
                Request schema includes unredacted member ID and date of birth fields referenced by the adjudication
                subgraph.
              </p>
              <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                Linked in the evidence trail and manifest decision record for this review package.
              </p>
              <div className="mt-2">
                <Link href={reviewContextHref} className="text-xs font-medium text-sky-700 underline dark:text-sky-300">
                  Open cited evidence
                </Link>
              </div>
            </li>
          </ul>
        ) : (
          <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">No related graph citations on file.</p>
        )
      ) : (
        <ul className="mt-2 list-none space-y-3 p-0 text-sm">
          {evidence.map((row, idx) => {
            const excerpt = row.excerpt?.trim() ?? "";
            const title = evidenceCitationTitle(row);
            const linkLabel = evidenceLinkLabel(row, reviewContextLabel);

            return (
              <li
                key={`${row.excerpt ?? "ev"}-${row.artifactId ?? ""}-${idx}`}
                className="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/60"
              >
                <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
                {excerpt.length > 0 ? (
                  <EvidenceExcerptBody text={excerpt} />
                ) : null}
                {buyerPolishedShell && (row.lineRange || row.artifactId) ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      View technical citation
                    </summary>
                    <div className="mt-1 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                      {row.lineRange ? <p className="m-0">Lines: {row.lineRange}</p> : null}
                      {row.artifactId ? <p className="m-0 font-mono">Artifact id: {row.artifactId}</p> : null}
                    </div>
                  </details>
                ) : (
                  <>
                    {row.lineRange ? (
                      <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">Lines: {row.lineRange}</p>
                    ) : null}
                    {row.artifactId ? (
                      <p className="m-0 mt-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                        Artifact id: {row.artifactId}
                      </p>
                    ) : null}
                  </>
                )}
                <div className="mt-2">
                  <Link href={reviewContextHref} className="text-xs font-medium text-sky-700 underline dark:text-sky-300">
                    {linkLabel}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
