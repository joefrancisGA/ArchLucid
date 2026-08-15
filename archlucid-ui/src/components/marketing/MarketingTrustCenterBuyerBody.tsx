import { cn } from "@/lib/utils";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactNode } from "react";

import { TrustCenterEvidenceOrientationStrip } from "@/components/marketing/TrustCenterEvidenceOrientationStrip";
import { TrustAssuranceSecurityTrustVocabularyRail } from "@/components/TrustAssuranceSecurityTrustVocabularyRail";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  TRUST_ASSURANCE_CLASSIFICATIONS,
  TRUST_ASSURANCE_GLANCE_PANELS,
  TRUST_CENTER_HERO,
  TRUST_CENTER_PUBLIC_EVIDENCE_VERSION,
  TRUST_CENTER_SECURITY_EMAIL,
  TRUST_CONTENT_CARDS,
  TRUST_PLANNED_ASSURANCE_MILESTONES,
  TRUST_PUBLIC_EVIDENCE_RELEASE,
  TRUST_SECURITY_CONTACT,
  type TrustAssuranceClassification,
} from "@/lib/trust-center-buyer-content";
import {
  TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
  TRUST_CENTER_PAGE_PURPOSE,
  TRUST_CENTER_RELATED_HELP_LINKS,
  TRUST_PUBLIC_ASSURANCE_ARTIFACTS,
} from "@/lib/trust-center-public-assurance";

export type MarketingTrustCenterBuyerBodyProps = {
  readonly lastReviewedUtc: string | null;
};

function AssuranceClassificationTag(props: {
  readonly classification: TrustAssuranceClassification;
}): ReactNode {
  const label: string = TRUST_ASSURANCE_CLASSIFICATIONS[props.classification];
  const kind =
    props.classification === "public"
      ? "ready"
      : props.classification === "planned"
        ? "draft"
        : "needs-attention";

  return (
    <StatusTag
      kind={kind}
      label={label}
      data-testid={`trust-classification-${props.classification}`}
    />
  );
}

function formatTrustReviewDate(lastReviewedUtc: string | null): string {
  if (lastReviewedUtc === null) {
    return "Updated with each assurance-cycle refresh";
  }

  const parsed: Date = new Date(lastReviewedUtc);

  if (Number.isNaN(parsed.getTime())) {
    return lastReviewedUtc;
  }

  return parsed.toISOString().slice(0, 10);
}

/** Public Trust Center structured layout (marketing route). Does not imply SOC 2 CPA attestation or completed third-party penetration tests unless a published summary states otherwise. */
export function MarketingTrustCenterBuyerBody(props: MarketingTrustCenterBuyerBodyProps): ReactNode {
  const { lastReviewedUtc } = props;
  const reviewedLabel: string = formatTrustReviewDate(lastReviewedUtc);

  return (
    <div className="space-y-12" data-testid="trust-center-body">
      <header className="space-y-5" data-testid="trust-center-hero">
        <div className="max-w-3xl">
          <h1 className={cn("font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
            {TRUST_CENTER_HERO.title}
          </h1>
          <p className={cn("mt-3 text-lg leading-relaxed text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {TRUST_CENTER_HERO.subtitle}
          </p>
          <p className={cn("mt-2 max-w-prose leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {TRUST_CENTER_HERO.intro}
          </p>
          <p
            className={cn("mt-2 max-w-prose text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}
            data-testid="trust-center-page-purpose"
          >
            {TRUST_CENTER_PAGE_PURPOSE}
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Button variant="primary" size="default" asChild data-testid="trust-center-primary-action">
            <Link href={`mailto:${TRUST_CENTER_SECURITY_EMAIL}`}>Request diligence materials</Link>
          </Button>
          <nav
            className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
            aria-label="Trust Center secondary actions"
            data-testid="trust-center-secondary-links"
          >
            <Link href="#trust-public-evidence" className={MARKETING_SURFACES.inlineLink}>
              View public evidence
            </Link>
            <Link href="#trust-contact-review" className={MARKETING_SURFACES.inlineLink}>
              Contact security
            </Link>
            <Link href="/privacy" className={MARKETING_SURFACES.inlineLink}>
              Privacy policy
            </Link>
            <Link href="/security-trust" className={MARKETING_SURFACES.inlineLink}>
              Assurance status
            </Link>
          </nav>
        </div>
      </header>

      <TrustAssuranceSecurityTrustVocabularyRail currentSurfaceId="trust-center" />

      <section aria-labelledby="trust-assurance-glance-heading" data-testid="trust-center-assurance-glance">
        <h2
          id="trust-assurance-glance-heading"
          className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          Assurance at a glance
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3" data-testid="trust-center-assurance-grid">
          {TRUST_ASSURANCE_GLANCE_PANELS.map((panel) => (
            <article
              key={panel.id}
              className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
              data-testid={`trust-glance-panel-${panel.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
                  {panel.title}
                </h3>
                <AssuranceClassificationTag classification={panel.classification} />
              </div>
              <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{panel.summary}</p>
              <ul className={cn("m-0 mt-3 list-disc space-y-2 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                {panel.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              {panel.actionHref !== undefined && panel.actionLabel !== undefined ? (
                <p className="mt-4">
                  <Link
                    href={panel.actionHref}
                    className={MARKETING_SURFACES.inlineLink}
                  >
                    {panel.actionLabel}
                  </Link>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section
        id="trust-public-downloads"
        aria-labelledby="trust-public-downloads-heading"
        data-testid="trust-center-public-downloads"
      >
        <h2
          id="trust-public-downloads-heading"
          className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          Public assurance downloads
        </h2>
        <p className={cn("m-0 mt-2 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          CAIQ, SOC 2 self-assessment, SIG Core, and owner-conducted pen-test materials are included in the
          anonymous evidence pack ZIP below. Individual help topics may require sign-in; the ZIP does not.
          Independent third-party penetration testing is planned, not yet scheduled — not implied by these artifacts.
        </p>
        <ul className="m-0 mt-5 grid list-none gap-4 p-0 md:grid-cols-2">
          {TRUST_PUBLIC_ASSURANCE_ARTIFACTS.map((artifact) => (
            <li key={artifact.id}>
              <article
                className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid={`trust-public-artifact-${artifact.id}`}
              >
                <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
                  {artifact.title}
                </h3>
                <p className={cn("m-0 mt-2 flex-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                  {artifact.description}
                </p>
                <p className="mt-4">
                  <Link
                    href={artifact.href}
                    className={MARKETING_SURFACES.inlineLink}
                    data-testid={`trust-public-artifact-link-${artifact.id}`}
                    rel={artifact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    target={artifact.href.startsWith("http") ? "_blank" : undefined}
                  >
                    {artifact.id === "evidence-pack-zip" ? "Download ZIP" : "View document"}
                  </Link>
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="trust-related-help-heading" data-testid="trust-center-related-help">
        <h2
          id="trust-related-help-heading"
          className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          Related product documentation
        </h2>
        <ul className={cn("m-0 mt-4 flex flex-wrap gap-x-4 gap-y-2", OPERATOR_TYPOGRAPHY.body)}>
          {TRUST_CENTER_RELATED_HELP_LINKS.map((link) => (
            <li key={link.id}>
              <Link
                href={link.href}
                className={MARKETING_SURFACES.inlineLink}
                data-testid={`trust-related-help-${link.id}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="trust-primary-content-heading" data-testid="trust-center-content-grid">
        <h2
          id="trust-primary-content-heading"
          className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          Trust content
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {TRUST_CONTENT_CARDS.map((card) => (
            <article
              key={card.id}
              id={card.sectionId}
              className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
              data-testid={`trust-content-card-${card.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
                  {card.title}
                </h3>
                <AssuranceClassificationTag classification={card.classification} />
              </div>
              <p className={cn("m-0 mt-3 max-w-prose flex-1 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                {card.description}
              </p>
              <p className="mt-4">
                <Link
                  href={card.actionHref}
                  className={MARKETING_SURFACES.inlineLink}
                >
                  {card.actionLabel}
                </Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="trust-planned-assurance" aria-labelledby="trust-planned-assurance-heading" data-testid="trust-center-planned-assurance">
        <h2
          id="trust-planned-assurance-heading"
          className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          Planned assurance
        </h2>
        <p className={cn("mt-2 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Roadmap items below describe intended programs. ArchLucid does not state certification, attestation, or independent
          validation unless a published summary explicitly says so.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <th scope="col" className={cn("px-4 py-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Activity
                </th>
                <th scope="col" className={cn("px-4 py-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Status
                </th>
                <th scope="col" className={cn("px-4 py-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Timing
                </th>
                <th scope="col" className={cn("px-4 py-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Deliverable
                </th>
                <th scope="col" className={cn("px-4 py-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Availability
                </th>
              </tr>
            </thead>
            <tbody>
              {TRUST_PLANNED_ASSURANCE_MILESTONES.map((milestone) => (
                <tr key={milestone.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className={cn("px-4 py-3 align-top text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    <div className="space-y-2">
                      <p className="m-0 font-medium">{milestone.activity}</p>
                      <AssuranceClassificationTag classification={milestone.classification} />
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 align-top text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{milestone.status}</td>
                  <td className={cn("px-4 py-3 align-top text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{milestone.timing}</td>
                  <td className={cn("px-4 py-3 align-top text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{milestone.deliverable}</td>
                  <td className={cn("px-4 py-3 align-top text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{milestone.availability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="trust-public-evidence"
        aria-labelledby="trust-public-evidence-heading"
        className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="trust-center-public-evidence"
      >
        <h2
          id="trust-public-evidence-heading"
          className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          Public evidence release
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Artifact name</dt>
            <dd className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{TRUST_PUBLIC_EVIDENCE_RELEASE.artifactName}</dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Version</dt>
            <dd className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="trust-evidence-version">
              {TRUST_CENTER_PUBLIC_EVIDENCE_VERSION}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Last reviewed</dt>
            <dd className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="trust-evidence-reviewed">
              {reviewedLabel}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Availability</dt>
            <dd className="m-0 mt-1">
              <AssuranceClassificationTag classification={TRUST_PUBLIC_EVIDENCE_RELEASE.classification} />
            </dd>
          </div>
        </dl>
        <p className={cn("m-0 mt-4 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {TRUST_PUBLIC_EVIDENCE_RELEASE.description}
        </p>
        <p className="mt-4">
          <Link
            href={TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF}
            className={MARKETING_SURFACES.inlineLink}
            data-testid="trust-center-evidence-pack-link"
          >
            Download evidence pack (ZIP)
          </Link>
        </p>
        <p className="mt-4">
          <Link
            href={`mailto:${TRUST_CENTER_SECURITY_EMAIL}?subject=${encodeURIComponent(TRUST_PUBLIC_EVIDENCE_RELEASE.requestSubject)}`}
            className={MARKETING_SURFACES.inlineLink}
            data-testid="trust-center-evidence-request-link"
          >
            Request public evidence summary
          </Link>
        </p>
      </section>

      <section
        id="trust-contact-review"
        aria-labelledby="trust-contact-review-heading"
        className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-6 dark:border-neutral-700 dark:bg-neutral-900/50"
        data-testid="trust-center-security-contact"
      >
        <h2
          id="trust-contact-review-heading"
          className={cn("font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          {TRUST_SECURITY_CONTACT.title}
        </h2>
        <p className={cn("m-0 mt-3 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {TRUST_SECURITY_CONTACT.intro}
        </p>
        <p className={cn("m-0 mt-4", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            className={cn(MARKETING_SURFACES.inlineLink, "font-semibold")}
            href={`mailto:${TRUST_CENTER_SECURITY_EMAIL}`}
          >
            {TRUST_CENTER_SECURITY_EMAIL}
          </Link>
        </p>
      </section>

      <TrustCenterEvidenceOrientationStrip />
    </div>
  );
}

