import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MARKETING_CAPTION_TEXT_CLASS,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { CANONICAL_GET_STARTED_PATH } from "@/lib/legacy-quick-start-route";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { TRUST_CENTER_PUBLIC_EVIDENCE_VERSION } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

import {
  SEE_IT_LAST_REVIEWED_LABEL,
  SEE_IT_SECONDARY_GET_STARTED_LABEL,
} from "./see-it-page-content";
import { SeeItDeliverablePreview } from "./SeeItDeliverablePreview";

/** Shorter than the shared outcome-led line — hero visuals carry the rest. */
export const SEE_IT_HERO_LEAD =
  "Evidence-backed proof export — sealed review record, findings, and audit trail — not a chat transcript.";

/** First-viewport hero for `/see-it` — one headline, one lead, one primary CTA, sample preview rail (TB-1281). */
export function SeeItHeroSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="see-it-hero-heading"
      className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12"
      data-testid="see-it-hero"
    >
      <div>
        <h1 id="see-it-hero-heading" className={MARKETING_TYPOGRAPHY.heroTitle}>
          {SEE_IT_PAGE_TITLE}
        </h1>
        <p
          className={cn("mt-4 max-w-xl", MARKETING_TYPOGRAPHY.lead)}
          data-testid="see-it-outcome-led-lead"
        >
          {SEE_IT_HERO_LEAD}
        </p>
        <div className={TRUST_CENTER_PUBLIC_LAYOUT.metaRow} data-testid="see-it-hero-meta">
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.lastReviewed}>
            Last reviewed{" "}
            <time dateTime={SEE_IT_LAST_REVIEWED_LABEL}>{SEE_IT_LAST_REVIEWED_LABEL}</time>
          </span>
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.metaSecondary}>
            Orientation pack version {TRUST_CENTER_PUBLIC_EVIDENCE_VERSION}
          </span>
        </div>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild variant="primary" size="lg" data-testid="see-it-cta-showcase">
            <Link href={CANONICAL_ANONYMOUS_PROOF_HREF}>Open interactive sample review</Link>
          </Button>
          <Button asChild variant="outline" size="lg" data-testid="see-it-cta-get-started">
            <Link href={CANONICAL_GET_STARTED_PATH}>{SEE_IT_SECONDARY_GET_STARTED_LABEL}</Link>
          </Button>
        </div>
        <p className={cn("mt-3 m-0", MARKETING_TYPOGRAPHY.meta, MARKETING_CAPTION_TEXT_CLASS)}>
          Primary CTA opens the full interactive sample — no sign-in required.
        </p>
        <p className={cn("mt-2 m-0", MARKETING_TYPOGRAPHY.meta)}>
          <Link className={MARKETING_SURFACES.inlineLink} href={CANONICAL_GET_STARTED_PATH}>
            Compare guided trial vs sample paths
          </Link>
        </p>
      </div>

      <SeeItDeliverablePreview />
    </section>
  );
}
