import { MarketingProofChainStrip } from "@/components/marketing/MarketingProofChainStrip";
import { Button } from "@/components/ui/button";
import {
  MARKETING_CAPTION_TEXT_CLASS,
  MARKETING_MOTION,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  SEE_IT_MARKETING_PDF_DOWNLOAD_FILENAME,
  SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL,
  SEE_IT_MARKETING_PDF_HELPER,
  SEE_IT_MARKETING_PDF_HREF,
} from "@/lib/see-it-page-copy";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { resolveSampleScenarioByRunId } from "@/lib/samples/registry";
import { cn } from "@/lib/utils";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import { SeeItKeyDeliverables } from "./SeeItKeyDeliverables";
import { SeeItPackageSummary } from "./SeeItPackageSummary";
import type { SeeItPreviewSource } from "./load-see-it-demo-preview";
import { resolveSeeItDemoUniverse, seeItUniverseBannerTitleForPayload } from "./see-it-demo-universe";

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
  const bannerTitle = seeItUniverseBannerTitleForPayload(payload);
  const description = (payload.run?.description ?? "").trim();
  const scenario = resolveSampleScenarioByRunId(payload.run?.runId);
  // Review title follows the same fail-closed universe as the banner (TB-1279) — never Claims title on unknown/Contoso.
  const reviewTitle =
    universe === "claims" && scenario !== null
      ? scenario.buyerReviewTitle
      : description.length > 0
        ? description
        : "Architecture review";

  const previewDisclosure =
    source === "snapshot"
      ? "Public read-only evaluation preview (finalized January 2026). Illustrative sample only — tenant-accurate reviews use a signed-in workspace."
      : "Public read-only evaluation preview from the demo API. Illustrative sample only — tenant-accurate reviews use a signed-in workspace.";

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
            )}
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
            href={SEE_IT_MARKETING_PDF_HREF}
            download={SEE_IT_MARKETING_PDF_DOWNLOAD_FILENAME}
          >
            {SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL}
          </a>
        </Button>
      </section>
      <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta, MARKETING_CAPTION_TEXT_CLASS)}>
        {SEE_IT_MARKETING_PDF_HELPER}
      </p>
    </div>
  );
}
