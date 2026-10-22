import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { AssuranceStatusPageChrome } from "@/components/marketing/assurance-status/AssuranceStatusPageChrome";
import { AssuranceStatusPageHero } from "@/components/marketing/assurance-status/AssuranceStatusPageHero";
import { AssuranceStatusVocabularyDisclosure } from "@/components/marketing/assurance-status/AssuranceStatusVocabularyDisclosure";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import { StatusTag } from "@/components/ui/status-tag";
import { ASSURANCE_STATUS_REVISION_HISTORY } from "@/lib/assurance-status-marketing-revision-history";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  assuranceEvidenceClassification,
  assuranceMaturityBadgeLabel,
  SECURITY_TRUST_MATURITY_SECTION_HEADINGS,
  SECURITY_TRUST_SOC2_READINESS_FOOTNOTE,
  securityTrustEngagementRows,
  type AssuranceEngagementRow,
  type AssuranceMaturityTier,
} from "@/lib/security-trust-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { formatTrustCenterReviewDate } from "@/lib/trust-center-review-date";
import type { TrustCenterReviewDateDisplay } from "@/lib/trust-center-review-date";

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
  const reviewDate: TrustCenterReviewDateDisplay = formatTrustCenterReviewDate(props.lastReviewedUtc);
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
      <AssuranceStatusPageChrome hero={<AssuranceStatusPageHero reviewDate={reviewDate} />}>
        <AssuranceStatusVocabularyDisclosure />

        <section aria-labelledby="security-trust-assurance-ladder" className="space-y-6">
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
      </AssuranceStatusPageChrome>
    </MarketingPageShell>
  );
}
