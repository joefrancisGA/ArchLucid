import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getArtifactBusinessLabel } from "@/lib/artifact-review-helpers";
import {
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
 */
export function SeeItMarketingBody({ source, payload }: SeeItMarketingBodyProps) {
  const artifactList = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const firstArtifacts = artifactList.slice(0, 3);
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
    <div className={cn("space-y-8", MARKETING_MOTION.revealIn)}>
      <div
        role="status"
        data-testid="see-it-demo-banner"
        data-see-it-universe={universe}
        className={cn(MARKETING_SURFACES.mutedPanel, "border border-neutral-200 dark:border-neutral-800")}
      >
        <p className={cn("m-0", MARKETING_TYPOGRAPHY.cardTitle)} data-testid="see-it-demo-banner-title">
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
            {source === "snapshot" ? <span data-testid="see-it-snapshot-notice">{previewDisclosure}</span> : previewDisclosure}
            {" "}
            Numbers and outcomes are illustrative only until you run the same path on buyer evidence.
          </p>
        </details>
      </div>

      <section data-testid="see-it-summary" className={MARKETING_SURFACES.cardComfort}>
        <h2 className={MARKETING_TYPOGRAPHY.sectionTitle}>Finalized sample architecture proof export (read-only)</h2>
        <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          One package links the review, evidence-backed findings, policy pack, artifacts, and sponsor-ready export so
          the proof is understandable before the platform depth.
        </p>
        <dl className={cn("mt-4 space-y-3", MARKETING_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Review</dt>
            <dd className="text-al-text-primary">{reviewTitle}</dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Policy pack</dt>
            <dd className="text-al-text-primary">{policyPackLabel}</dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Findings</dt>
            <dd className="text-al-text-primary" data-testid="see-it-finding-counts">
              {findingCountDisplay} finding{findingCountDisplay === "1" ? "" : "s"} recorded
              {complianceGapDisplay !== "—" && complianceGapDisplay !== "0"
                ? ` · ${complianceGapDisplay} monitored risk${complianceGapDisplay === "1" ? "" : "s"}`
                : ""}
            </dd>
          </div>
        </dl>
      </section>

      <section data-testid="see-it-artifacts" className={MARKETING_SURFACES.cardComfort}>
        <h2 className={MARKETING_TYPOGRAPHY.sectionTitle}>Key deliverables (preview)</h2>
        <ul className={cn("mt-4 list-disc space-y-2 pl-5 text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>
          {firstArtifacts.length ? (
            firstArtifacts.map((artifact) => (
              <li key={artifact.artifactId}>
                <span className="font-medium">{getArtifactBusinessLabel(artifact.artifactType)}</span>
              </li>
            ))
          ) : (
            <li data-testid="see-it-no-artifacts">
              Artifact descriptors will appear here once the preview payload includes generated outputs.
            </li>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild variant="primary">
          <a
            data-testid="see-it-proof-pack-download"
            href="/api/proxy/v1/marketing/why-archlucid-pack.pdf"
            download="why-archlucid-pack.pdf"
          >
            Download evidence bundle (PDF)
          </a>
        </Button>
        <Link
          data-testid="see-it-cta-demo-preview"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900"
          href="/demo/preview"
        >
          See a full sample review output — no sign-in
        </Link>
        <Link
          data-testid="see-it-full-preview-link"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900"
          href={CANONICAL_ANONYMOUS_PROOF_HREF}
        >
          Open healthcare claims sample review
        </Link>
      </section>
      <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
        The PDF is a no-sign-in marketing bundle aligned with this sample.
      </p>
    </div>
  );
}
