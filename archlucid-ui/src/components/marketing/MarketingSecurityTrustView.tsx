import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SecurityTrustEvidenceOrientationStrip } from "@/components/marketing/SecurityTrustEvidenceOrientationStrip";
import { TrustAssuranceSecurityTrustVocabularyRail } from "@/components/TrustAssuranceSecurityTrustVocabularyRail";
import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  assuranceEvidenceClassification,
  assuranceMaturityBadgeLabel,
  SECURITY_TRUST_EVIDENCE_GROUPS,
  SECURITY_TRUST_HERO_SUPPORTING,
  SECURITY_TRUST_MATURITY_SECTION_HEADINGS,
  SECURITY_TRUST_SOC2_READINESS_FOOTNOTE,
  SECURITY_TRUST_SUMMARY_COLUMNS,
  securityTrustEngagementRows,
  type AssuranceEngagementRow,
  type AssuranceMaturityTier,
} from "@/lib/security-trust-content";
import { SECURITY_TRUST_PAGE_PURPOSE } from "@/lib/trust-center-public-assurance";

const MATURITY_RENDER_ORDER: AssuranceMaturityTier[] = ["available_now", "during_diligence", "planned_next"];

type MarketingSecurityTrustViewProps = {
  rows?: ReadonlyArray<AssuranceEngagementRow>;
};

function renderSummaryAccess(row: AssuranceEngagementRow): ReactNode {
  if (row.summaryAccess.kind === "public" && row.summaryAccess.href) {
    return (
      <Link
        className={MARKETING_SURFACES.inlineLink}
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

function SecurityTrustPrimaryActions(props: { readonly testId?: string }): ReactNode {
  return (
    <div className="flex flex-wrap gap-2" data-testid={props.testId ?? "security-trust-primary-ctas"}>
      <Button variant="primary" size="sm" asChild>
        <Link href="/trust">View public evidence</Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/trust#trust-contact-review">Request diligence materials</Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href="mailto:security@archlucid.net">Contact security</a>
      </Button>
    </div>
  );
}

function AssuranceStatusBadge(props: { readonly label: string; readonly classification: string }): ReactNode {
  const { label, classification } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        data-testid="assurance-maturity-badge"
      >
        <span className={MARKETING_TYPOGRAPHY.meta}>{label}</span>
      </span>
      <span
        className="inline-flex rounded border border-neutral-200 bg-white px-2 py-0.5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
        data-testid="assurance-access-badge"
      >
        <span className={MARKETING_TYPOGRAPHY.meta}>{classification}</span>
      </span>
    </div>
  );
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
    <MarketingPageShell variant="trust" className="space-y-10">
      <section aria-labelledby="security-trust-hero" className="space-y-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <h1 id="security-trust-hero" className={MARKETING_TYPOGRAPHY.pageTitle}>
          Assurance status
        </h1>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{SECURITY_TRUST_HERO_SUPPORTING}</p>
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}
          data-testid="security-trust-page-purpose"
        >
          {SECURITY_TRUST_PAGE_PURPOSE}{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/trust#trust-public-downloads">
            Open Trust Center downloads
          </Link>
          .
        </p>
        <SecurityTrustPrimaryActions testId="security-trust-hero-ctas" />
      </section>

      <TrustAssuranceSecurityTrustVocabularyRail currentSurfaceId="assurance-status" />

      <section aria-labelledby="security-trust-evidence-groups" className="space-y-4">
        <h2 id="security-trust-evidence-groups" className={MARKETING_TYPOGRAPHY.sectionTitle}>
          What you can review today
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SECURITY_TRUST_EVIDENCE_GROUPS.map((group) => (
            <article
              key={group.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
              data-testid={`security-trust-evidence-group-${group.id}`}
            >
              <h3 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>{group.title}</h3>
              <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{group.summary}</p>
              <ul className={cn("m-0 mt-3 list-disc space-y-1 pl-5 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                {group.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <details className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>
            Encryption key reference
          </summary>
          <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Published OpenPGP material:{" "}
            <Link className={MARKETING_SURFACES.inlineLink} href="/.well-known/pgp-key.txt">
              /.well-known/pgp-key.txt
            </Link>{" "}
            (see repository SECURITY.md for fingerprint).
          </p>
        </details>
      </section>

      <section aria-label="Assurance summary" data-testid="security-trust-summary-row">
        <div className="grid gap-4 lg:grid-cols-3">
          {SECURITY_TRUST_SUMMARY_COLUMNS.map((column) => (
            <article
              key={column.id}
              className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
              data-testid={`security-trust-summary-${column.id}`}
            >
              <h3 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>{column.title}</h3>
              <p className={cn("m-0 mt-2 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>{column.status}</p>
              <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{column.description}</p>
              {column.href && column.linkLabel ? (
                <p className={cn("m-0 mt-3", MARKETING_TYPOGRAPHY.body)}>
                  <Link className={MARKETING_SURFACES.inlineLink} href={column.href}>
                    {column.linkLabel}
                  </Link>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="security-trust-assurance-ladder" className="scroll-mt-24 space-y-6">
        <div>
          <h2 id="security-trust-assurance-ladder" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            Assurance posture
          </h2>
          <p className={cn("m-0 mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Current assurance activities, what is public today, what is shared under NDA, and what is planned next.
          </p>
        </div>

        {MATURITY_RENDER_ORDER.map((tier) => {
          const tierRows = byTier.get(tier);

          if (tierRows === undefined || tierRows.length === 0) {
            return null;
          }

          const meta = SECURITY_TRUST_MATURITY_SECTION_HEADINGS[tier];

          return (
            <div key={tier} className="space-y-4">
              <div>
                <h3 id={meta.id} className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
                  {meta.title}
                </h3>
                <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{meta.intro}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2" data-testid={`security-trust-assurance-grid-${tier}`}>
                {tierRows.map((row) => (
                  <article
                    key={row.id}
                    data-testid={`assurance-row-${row.id}`}
                    className={cn(
                      "rounded-lg border p-4",
                      tier === "planned_next"
                        ? "border-dashed border-neutral-300 bg-neutral-50/80 dark:border-neutral-600 dark:bg-neutral-950/30"
                        : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
                    )}
                  >
                    <h4 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>{row.engagement}</h4>
                    <div className="mt-3">
                      <AssuranceStatusBadge
                        label={assuranceMaturityBadgeLabel(row.maturityTier)}
                        classification={assuranceEvidenceClassification(row)}
                      />
                      <span className="sr-only" data-testid="assurance-vendor">
                        {row.vendor}
                      </span>
                    </div>
                    <p className={cn("m-0 mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{row.scope}</p>
                    <p className={cn("m-0 mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                      <span className="font-medium text-al-text-primary">Available artifact:</span> {renderSummaryAccess(row)}
                    </p>
                    <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                      <span className="font-medium text-al-text-primary">Next milestone:</span> {row.completedUtc}
                    </p>
                    {row.id === "owner-security-self-assessment-2026" ? (
                      <p className={cn("m-0 mt-3 border-t border-neutral-200 pt-3 text-al-text-secondary dark:border-neutral-700", MARKETING_TYPOGRAPHY.meta)}>
                        {SECURITY_TRUST_SOC2_READINESS_FOOTNOTE}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section
        aria-labelledby="security-trust-contact"
        className="rounded-lg border border-neutral-200 bg-al-surface-raised p-5 dark:border-neutral-800"
        data-testid="security-trust-contact-section"
      >
        <h2 id="security-trust-contact" className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}>
          Security and due-diligence contact
        </h2>
        <p className={cn("m-0 mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Email{" "}
          <a className={MARKETING_SURFACES.inlineLink} href="mailto:security@archlucid.net" data-testid="security-trust-contact-email">
            security@archlucid.net
          </a>{" "}
          to request diligence materials, coordinate secure disclosure, or ask about assurance status.
        </p>
        <div className="mt-4">
          <SecurityTrustPrimaryActions />
        </div>
      </section>

      <SecurityTrustEvidenceOrientationStrip />
    </MarketingPageShell>
  );
}
