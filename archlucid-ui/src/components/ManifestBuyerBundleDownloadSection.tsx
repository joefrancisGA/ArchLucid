import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { getBundleDownloadUrl } from "@/lib/api";
import {
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY,
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE,
} from "@/lib/buyer/buyer-polish-copy";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { whyDisabledNeedsPrerequisite } from "@/lib/why-disabled-cta";
import type { ReactElement } from "react";

export type ManifestBuyerBundleDownloadSectionProps = {
  readonly manifestId: string;
  readonly runId: string;
  /** Tab panel: show ZIP actions immediately instead of a collapsed disclosure. */
  readonly expanded?: boolean;
};

function bundleDownloadCopyAndAction(
  manifestId: string,
  blockedHintId: string,
  downloadsDisabled: boolean,
): ReactElement {
  return (
    <>
      <p className={cn("m-0 max-w-prose text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        Prefer the consolidated bundle for diligence and archiving — it packages the downloadable outputs that align to
        the decisions and deliverables summarized on this page.
      </p>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {downloadsDisabled ? (
          <Button variant="primary" size="sm" disabled aria-describedby={blockedHintId}>
            Download finalized review
          </Button>
        ) : (
          <Button variant="primary" size="sm" asChild>
            <a href={getBundleDownloadUrl(manifestId)}>Download finalized review</a>
          </Button>
        )}
      </div>
    </>
  );
}

/** Bundle ZIP download — disclosure on stacked layouts, open card when it is the whole tab. */
export function ManifestBuyerBundleDownloadSection(props: ManifestBuyerBundleDownloadSectionProps) {
  const { manifestId, runId, expanded } = props;
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: runId.trim(),
    manifestVersion: manifestId.trim(),
  });
  const deliverableDisabledReason =
    sealedManifestBlockedReason === null ? null : whyDisabledNeedsPrerequisite(sealedManifestBlockedReason);
  const blockedHintId = "manifest-buyer-bundle-download-blocked-hint";
  const downloadsDisabled = deliverableDisabledReason !== null;
  const action = bundleDownloadCopyAndAction(manifestId, blockedHintId, downloadsDisabled);

  if (expanded === true) {
    return (
      <Card
        id="manifest-bundle-zip"
        className="scroll-mt-24"
        data-testid="manifest-buyer-bundle-download"
      >
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deliverableDisabledReason !== null ? (
            <WhyDisabledCtaHint id={blockedHintId} reason={deliverableDisabledReason} />
          ) : null}
          {action}
        </CardContent>
      </Card>
    );
  }

  return (
    <details
      id="manifest-bundle-zip"
      className="scroll-mt-24 rounded-lg border border-neutral-200/90 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-950/30"
      data-testid="manifest-buyer-bundle-download"
    >
      <summary className={cn("cursor-pointer select-none px-3 py-2 font-medium text-neutral-900 outline-none marker:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY}
      </summary>
      <div className="space-y-3 border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {deliverableDisabledReason !== null ? (
          <WhyDisabledCtaHint id={blockedHintId} reason={deliverableDisabledReason} />
        ) : null}
        {action}
      </div>
    </details>
  );
}
