import Link from "next/link";

import { MarketingProofChainStrip } from "@/components/marketing/MarketingProofChainStrip";
import { Button } from "@/components/ui/button";
import {
  MARKETING_CAPTION_TEXT_CLASS,
  MARKETING_MOTION,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  CANONICAL_ANONYMOUS_PROOF_HREF,
  SHOWCASE_BUYER_REVIEW_TITLE,
} from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import { SeeItKeyDeliverables } from "./SeeItKeyDeliverables";
import { SeeItPackageSummary } from "./SeeItPackageSummary";
import type { SeeItPreviewSource } from "./load-see-it-demo-preview";
import { resolveSeeItDemoUniverse, seeItUniverseBannerTitle } from "./see-it-demo-universe";

export type SeeItMarketingBodyProps = {
  source: SeeItPreviewSource;
  payload: DemoCommitPagePreviewResponse;
};

function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return String(value);
}

/**
 * Anonymous marketing slice — only fields present on `DemoCommitPagePreviewResponse`.
 * Narrative order: deliverable summary → richness → chat differentiation → secondary CTAs.
 */
export function SeeItMarketingBody({ source, payload }: SeeItMarketingBodyProps) {
  const artifactList = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const ruleSetId = payload.manifest?.ruleSetId ?? "";
  const ruleSetVersion = payload.manifest?.ruleSetVersion ?? "";
  const policyPackLabel = policyPackBuyerLabel(ruleSetId, ruleSetVersion);
  const runExplanation = payload.runExplanation;
  const findingCountDisplay = formatCount(runExplanation?.findingCount);
  const complianceGapDisplay = formatCount(runExplanation?.complianceGapCount);
  const universe = resolveSeeItDemoUniverse(payload);
  const bannerTitle = seeItUniverseBannerTitle(universe);
  const description = (payload.run?.description ?? "").trim();
  // Review title follows the same fail-closed universe as the banner (TB-1279) — never Claims title on unknown/Contoso.
  const reviewTitle =
    universe === "claims"
      ? SHOWCASE_BUYER_REVIEW_TITLE
      : description.length > 0
        ? description
        : "Architecture review";

  const previewDisclosure =
    source === "snapshot"
      ? "Public read-only evaluation preview (finalized January 2026). Tenant-accurate reviews and full artifact bytes use a signed-in workspace — this page stays a stable evaluation slice."
      : "Public read-only evaluation preview. Tenant-accurate reviews and full artifact bytes use a signed-in workspace.";

  return (
    <div className={cn("space-y-10", MARKETING_MOTION.revealIn)}>
      <div
        role="status"
        data-testid="see-it-demo-banner"
        data-see-it-universe={universe}
        className={cn(MARKETING_SURFACES.mutedPanel, "border border-neutral-200 dark:border-neutral-800")}
      >
        <p
          className={cn("m-0", MARKETING_TYPOGRAPHY.sectionTitle)}
          data-testid="see-it-demo-banner-title"
        >
          {bannerTitle}
        </p>
        <details className="mt-3 group">
          <summary
            className={cn(
              "cursor-pointer select-none font-medium text-al-text-secondary",
              MARKETING_TYPOGRAPHY.meta,
            )}
          >
            Preview scope and limitations
          </summary>
          <p
            className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}
            data-testid="see-it-preview-disclosure"
          >
            {source === "snapshot" ? (
              <span data-testid="see-it-snapshot-notice">{previewDisclosure}</span>
            ) : (
              previewDisclosure
            )}{" "}
            Numbers and outcomes are illustrative only until you run the same path on buyer evidence.
          </p>
        </details>
      </div>

      <SeeItPackageSummary
        reviewTitle={reviewTitle}
        policyPackLabel={policyPackLabel}
        findingCountDisplay={findingCountDisplay}
        complianceGapDisplay={complianceGapDisplay}
      />

      <SeeItKeyDeliverables artifacts={artifactList} />

      <MarketingProofChainStrip />

      <section
        aria-label="Secondary sample actions"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        data-testid="see-it-secondary-cta-row"
      >
        <Button asChild variant="outline">
          <a
            data-testid="see-it-proof-pack-download"
            href="/api/proxy/v1/marketing/why-archlucid-pack.pdf"
            download="why-archlucid-pack.pdf"
          >
            Download sample overview (PDF)
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link data-testid="see-it-full-preview-link" href={CANONICAL_ANONYMOUS_PROOF_HREF}>
            Open interactive sample review
          </Link>
        </Button>
      </section>
      <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta, MARKETING_CAPTION_TEXT_CLASS)}>
        The PDF is a no-sign-in marketing overview aligned with this sample — not the full governed evidence
        bundle from a signed-in workspace.
      </p>
    </div>
  );
}
