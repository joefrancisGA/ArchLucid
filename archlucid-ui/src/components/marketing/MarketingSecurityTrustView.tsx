import Link from "next/link";
import type { ReactNode } from "react";

import {
  SECURITY_TRUST_MATURITY_SECTION_HEADINGS,
  SECURITY_TRUST_NDA_NOTICE,
  SECURITY_TRUST_SOC2_READINESS_FOOTNOTE,
  securityTrustEngagementRows,
  type AssuranceEngagementRow,
  type AssuranceMaturityTier,
} from "@/lib/security-trust-content";

const MATURITY_RENDER_ORDER: AssuranceMaturityTier[] = ["available_now", "during_diligence", "planned_next"];

type MarketingSecurityTrustViewProps = {
  rows?: ReadonlyArray<AssuranceEngagementRow>;
};

function renderSummaryAccess(row: AssuranceEngagementRow): ReactNode {
  if (row.summaryAccess.kind === "public" && row.summaryAccess.href) {
    return (
      <Link
        className="text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
        href={row.summaryAccess.href}
        rel={row.summaryAccess.href.startsWith("http") ? "noopener noreferrer" : undefined}
        target={row.summaryAccess.href.startsWith("http") ? "_blank" : undefined}
      >
        {row.summaryAccess.description}
      </Link>
    );
  }

  return <span>{row.summaryAccess.description}</span>;
}

/** Public engagement metadata — procurement-safe cards (no truncated wide tables). */
export function MarketingSecurityTrustView(props: MarketingSecurityTrustViewProps): ReactNode {
  const rows = props.rows ?? securityTrustEngagementRows;
  const byTier = new Map<AssuranceMaturityTier, AssuranceEngagementRow[]>();

  for (const row of rows) {
    const bucket = byTier.get(row.maturityTier);

    if (bucket === undefined) {
      byTier.set(row.maturityTier, [row]);
    } else {
      bucket.push(row);
    }
  }

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10" tabIndex={-1}>
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Security &amp; trust</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        This public page summarizes assurance status. Detailed reports are shared during diligence. Consolidated questionnaires
        and public evidence summaries are available in the{" "}
        <Link className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300" href="/trust">
          Trust Center
        </Link>
        .
      </p>

      <section
        aria-label="Third-party assurance and NDA"
        className="mt-6 rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40"
      >
        <p className="m-0 text-sm font-semibold text-sky-950 dark:text-sky-100">Sensitive reports under NDA</p>
        <p className="m-0 mt-2 text-sm text-sky-950/90 dark:text-sky-100/90">{SECURITY_TRUST_NDA_NOTICE}</p>
      </section>

      <section aria-labelledby="security-trust-assurance-ladder" className="mt-8 scroll-mt-24">
        <h2
          id="security-trust-assurance-ladder"
          className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
        >
          Assurance posture
        </h2>
        <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
          Grouped by what exists today, what is delivered through diligence, and what is scheduled next — so reviewers see
          the maturity picture in one pass.
        </p>

        <div className="mt-8 space-y-12">
          {MATURITY_RENDER_ORDER.map((tier) => {
            const tierRows = byTier.get(tier);

            if (tierRows === undefined || tierRows.length === 0) {
              return null;
            }

            const meta = SECURITY_TRUST_MATURITY_SECTION_HEADINGS[tier];

            return (
              <div key={tier} className="space-y-4">
                <div>
                  <h3 id={meta.id} className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {meta.title}
                  </h3>
                  <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">{meta.intro}</p>
                </div>
                <div className="space-y-4">
                  {tierRows.map((row) => (
                    <article
                      key={row.id}
                      data-testid={`assurance-row-${row.id}`}
                      className="rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/40"
                    >
                      <h4 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.engagement}
                      </h4>
                      <dl className="m-0 mt-3 grid gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                        <div className="flex flex-col gap-0.5">
                          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Responsible party
                          </dt>
                          <dd className="m-0">{row.vendor}</dd>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Scope
                          </dt>
                          <dd className="m-0 text-neutral-700 dark:text-neutral-300">{row.scope}</dd>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Timeline / completion
                          </dt>
                          <dd className="m-0 text-neutral-700 dark:text-neutral-300">{row.completedUtc}</dd>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Summary access
                          </dt>
                          <dd className="m-0">{renderSummaryAccess(row)}</dd>
                        </div>
                      </dl>
                      {row.id === "owner-security-self-assessment-2026" ? (
                        <p className="m-0 mt-3 border-t border-neutral-200 pt-3 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                          {SECURITY_TRUST_SOC2_READINESS_FOOTNOTE}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        <p>
          Procurement contact:{" "}
          <span className="font-medium text-neutral-800 dark:text-neutral-200">security@archlucid.net</span>
        </p>
      </footer>
    </main>
  );
}
