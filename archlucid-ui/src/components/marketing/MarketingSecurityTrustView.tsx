import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { AssuranceStatusVocabularyDisclosure } from "@/components/marketing/assurance-status/AssuranceStatusVocabularyDisclosure";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SecurityTrustEvidenceOrientationStrip } from "@/components/marketing/SecurityTrustEvidenceOrientationStrip";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { ASSURANCE_STATUS_REVISION_HISTORY } from "@/lib/assurance-status-marketing-revision-history";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  assuranceEvidenceClassification,
  assuranceMaturityBadgeLabel,
  SECURITY_TRUST_HERO_SUPPORTING,
  SECURITY_TRUST_MATURITY_SECTION_HEADINGS,
  SECURITY_TRUST_SOC2_READINESS_FOOTNOTE,
  securityTrustEngagementRows,
  type AssuranceEngagementRow,
  type AssuranceMaturityTier,
} from "@/lib/security-trust-content";
import { TRUST_CENTER_PUBLIC_EVIDENCE_VERSION } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { SECURITY_TRUST_PAGE_PURPOSE } from "@/lib/trust-center-public-assurance";

const MATURITY_RENDER_ORDER: AssuranceMaturityTier[] = ["available_now", "during_diligence", "planned_next"];

type MarketingSecurityTrustViewProps = {
  readonly rows?: ReadonlyArray<AssuranceEngagementRow>;
  readonly lastReviewedUtc?: string | null;
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

function formatAssuranceReviewDate(lastReviewedUtc: string | null | undefined): string {
  if (lastReviewedUtc === null || lastReviewedUtc === undefined) {
    return "Updated with each assurance-cycle refresh";
  }

  const parsed: Date = new Date(lastReviewedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return lastReviewedUtc;
  }

  return parsed.toISOString().slice(0, 10);
}

function assuranceMaturityStatusKind(tier: AssuranceMaturityTier): "ready" | "needs-attention" | "draft" {
  if (tier === "available_now") {
    return "ready";
  }

  if (tier === "during_diligence") {
    return "needs-attention";
  }

  return "draft";
}

function assuranceAccessStatusKind(row: AssuranceEngagementRow): "ready" | "needs-attention" | "draft" {
  if (row.maturityTier === "planned_next") {
    return "draft";
  }

  if (row.summaryAccess.kind === "public") {
    return "ready";
  }

  return "needs-attention";
}

/** Public engagement metadata — procurement-safe cards (no truncated wide tables). */
export function MarketingSecurityTrustView(props: MarketingSecurityTrustViewProps): ReactNode {
  const rows = props.rows ?? securityTrustEngagementRows;
  const reviewedLabel: string = formatAssuranceReviewDate(props.lastReviewedUtc);
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
    <MarketingPageShell variant="trust" className={cn("space-y-12", TRUST_CENTER_PUBLIC_LAYOUT.page)}>
      <a href="#assurance-status-primary-content" className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        Skip to assurance status content
      </a>

      <section
        aria-labelledby="security-trust-hero"
        className="space-y-5 border-b border-neutral-200 pb-8 dark:border-neutral-800"
        data-testid="assurance-status-hero"
      >
        <div className="max-w-3xl">
          <h1 id="security-trust-hero" className={cn("font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
            Assurance status
          </h1>
          <p className={cn("mt-3 text-lg leading-relaxed text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {SECURITY_TRUST_HERO_SUPPORTING}
          </p>
          <p
            className={cn("mt-2 max-w-prose leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
            data-testid="security-trust-page-purpose"
          >
            {SECURITY_TRUST_PAGE_PURPOSE}{" "}
            <Link className={MARKETING_SURFACES.inlineLink} href="/trust#trust-public-downloads">
              Open Trust Center downloads
            </Link>
            .
          </p>
          <div className={TRUST_CENTER_PUBLIC_LAYOUT.metaRow} data-testid="assurance-status-hero-meta">
            <span className={TRUST_CENTER_PUBLIC_LAYOUT.lastReviewed}>
              Last reviewed{" "}
              <time dateTime={reviewedLabel}>{reviewedLabel}</time>
            </span>
            <span className={TRUST_CENTER_PUBLIC_LAYOUT.metaSecondary}>
              Evidence pack version {TRUST_CENTER_PUBLIC_EVIDENCE_VERSION}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center" data-testid="security-trust-hero-ctas">
          <Button variant="primary" size="default" asChild>
            <Link href="/trust#trust-contact-review">Request diligence materials</Link>
          </Button>
          <Button variant="outline" size="default" asChild>
            <Link href="/trust">View public evidence</Link>
          </Button>
          <Button variant="outline" size="default" asChild>
            <a href="mailto:security@archlucid.net">Contact security</a>
          </Button>
        </div>
      </section>

      <AssuranceStatusVocabularyDisclosure />

      <section
        id="assurance-status-primary-content"
        aria-labelledby="security-trust-assurance-ladder"
        className="scroll-mt-24 space-y-6"
      >
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
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusTag
                        kind={assuranceMaturityStatusKind(row.maturityTier)}
                        label={assuranceMaturityBadgeLabel(row.maturityTier)}
                        data-testid="assurance-maturity-badge"
                      />
                      <StatusTag
                        kind={assuranceAccessStatusKind(row)}
                        label={assuranceEvidenceClassification(row)}
                        data-testid="assurance-access-badge"
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
                      <span className="font-medium text-al-text-primary">Review cadence:</span> {row.completedUtc}
                    </p>
                    {row.id === "owner-security-self-assessment-2026" ? (
                      <p
                        className={cn(
                          "m-0 mt-3 border-t border-neutral-200 pt-3 text-al-text-secondary dark:border-neutral-700",
                          MARKETING_TYPOGRAPHY.meta,
                        )}
                      >
                        {SECURITY_TRUST_SOC2_READINESS_FOOTNOTE}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          );
        })}

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
      </section>

      <TrustCenterRevisionHistory entries={ASSURANCE_STATUS_REVISION_HISTORY} />

      <SecurityTrustEvidenceOrientationStrip />
    </MarketingPageShell>
  );
}
