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

function assuranceTierBadgeLabel(tier: AssuranceMaturityTier): string {
  switch (tier) {
    case "available_now":
      return "Available now";

    case "during_diligence":
      return "During diligence";

    case "planned_next":
      return "Planned";

    default:
      return tier;
  }
}

function assuranceAccessBadgeLabel(kind: AssuranceEngagementRow["summaryAccess"]["kind"]): string {
  switch (kind) {
    case "public":
      return "Public";

    case "nda":
      return "Under NDA";
  }
}

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
        aria-label="Current assurance posture summary"
        className="mt-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-200"
      >
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">At a glance</p>
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Current posture: public procurement evidence is available now; detailed security summaries are shared during
          diligence; independent third-party testing is planned for the next assurance cycle.
        </p>
      </section>

      <section
        aria-labelledby="security-trust-buyer-proof-strip"
        className="mt-6 rounded-lg border-2 border-emerald-300 bg-emerald-50/80 px-4 py-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40"
      >
        <h2 id="security-trust-buyer-proof-strip" className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          Available for diligence today
        </h2>
        <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-800 dark:text-neutral-200">
          <li>Procurement-oriented evidence summary and questionnaire-ready excerpts</li>
          <li>Security and architecture documentation suitable for vendor reviews</li>
          <li>Control mapping aligned to common questionnaire structures</li>
          <li>Published data-handling posture suitable for privacy reviews</li>
          <li>Immutable audit instrumentation for material lifecycle changes</li>
          <li>Diligence intake via{" "}
            <a className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300" href="mailto:security@archlucid.net">
              security@archlucid.net
            </a>
          </li>
          <li>Coordinated secure disclosure and encrypted intake — details available through published security contact instructions.</li>
          <li className="mt-2 list-none pl-0">
            <details className="rounded-md border border-neutral-200 bg-white/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40">
              <summary className="cursor-pointer text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Encryption key reference
              </summary>
              <p className="m-0 mt-2 text-xs text-neutral-700 dark:text-neutral-300">
                Published OpenPGP material:{" "}
                <Link
                  className="font-medium text-blue-800 underline underline-offset-2 dark:text-blue-300"
                  href="/.well-known/pgp-key.txt"
                >
                  /.well-known/pgp-key.txt
                </Link>{" "}
                (see repository <span className="font-mono text-xs">SECURITY.md</span> for fingerprint).
              </p>
            </details>
          </li>
        </ul>
      </section>

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

            const plannedTierMuted = tier === "planned_next";

            return (
              <div key={tier} className={plannedTierMuted ? "space-y-4 opacity-75" : "space-y-4"}>
                <div>
                  <h3
                    id={meta.id}
                    className={
                      plannedTierMuted
                        ? "m-0 text-base font-semibold text-neutral-700 dark:text-neutral-300"
                        : "m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                    }
                  >
                    {meta.title}
                  </h3>
                  <p
                    className={
                      plannedTierMuted
                        ? "m-0 mt-2 text-xs text-neutral-500 dark:text-neutral-500"
                        : "m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400"
                    }
                  >
                    {meta.intro}
                  </p>
                </div>
                <div className="space-y-4">
                  {tierRows.map((row) => {
                    const isPlanned = tier === "planned_next";

                    return (
                    <article
                      key={row.id}
                      data-testid={`assurance-row-${row.id}`}
                      className={
                        isPlanned
                          ? "rounded-lg border border-dashed border-neutral-300 bg-neutral-50/70 px-4 py-3 dark:border-neutral-600 dark:bg-neutral-950/25"
                          : "rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/40"
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4
                          className={
                            isPlanned
                              ? "m-0 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                              : "m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100"
                          }
                        >
                          {row.engagement}
                        </h4>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                          <span
                            className="inline-flex rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200"
                            data-testid="assurance-maturity-badge"
                          >
                            {assuranceTierBadgeLabel(row.maturityTier)}
                          </span>
                          <span
                            className={
                              row.summaryAccess.kind === "nda"
                                ? "inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100"
                                : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                            }
                            data-testid="assurance-access-badge"
                          >
                            {assuranceAccessBadgeLabel(row.summaryAccess.kind)}
                          </span>
                        </div>
                      </div>
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
                    );
                  })}
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
