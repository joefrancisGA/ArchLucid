import Link from "next/link";
import type { ReactNode } from "react";

import { AssuranceStatusBreadcrumb } from "@/components/marketing/assurance-status/AssuranceStatusBreadcrumb";
import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ASSURANCE_STATUS_HERO_SUPPORTING,
  ASSURANCE_STATUS_PAGE_TITLE,
} from "@/lib/marketing/assurance-status-page-copy";
import { TRUST_CENTER_PUBLIC_EVIDENCE_VERSION } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { SECURITY_TRUST_PAGE_PURPOSE } from "@/lib/trust-center-public-assurance";
import type { TrustCenterReviewDateDisplay } from "@/lib/trust-center-review-date";
import { cn } from "@/lib/utils";
import { TrustCenterReviewTime } from "@/components/marketing/TrustCenterReviewTime";

type AssuranceStatusPageHeroProps = {
  readonly reviewDate: TrustCenterReviewDateDisplay;
};

/** Hero for `/assurance-status` — breadcrumb, title, diligence CTAs, and last-reviewed meta. */
export function AssuranceStatusPageHero(props: AssuranceStatusPageHeroProps): ReactNode {
  const { reviewDate } = props;

  return (
    <section
      aria-labelledby="security-trust-hero"
      className="space-y-5 border-b border-neutral-200 pb-8 dark:border-neutral-800"
      data-testid="assurance-status-hero"
    >
      <AssuranceStatusBreadcrumb />

      <div className="max-w-3xl">
        <h1 id="security-trust-hero" className={cn("font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {ASSURANCE_STATUS_PAGE_TITLE}
        </h1>
        <p className={cn("mt-3 text-lg leading-relaxed text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {ASSURANCE_STATUS_HERO_SUPPORTING}
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
            <TrustCenterReviewTime reviewDate={reviewDate} />
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
  );
}
