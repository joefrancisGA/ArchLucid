"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { downloadArtifactBundleZip } from "@/lib/api/downloads-blob-trigger-artifact-bundle";
import {
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY,
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  manifestBuyerBundleDownloadDisclosureHrefFromSearch,
  parseManifestBuyerBundleDownloadOpenFromSearch,
} from "@/lib/governance/manifest-buyer-bundle-download-disclosure-url";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { whyDisabledNeedsPrerequisite } from "@/lib/why-disabled-cta";
import { showError } from "@/lib/toast";

export type ManifestBuyerBundleDownloadSectionProps = {
  readonly manifestId: string;
  readonly runId: string;
  /** Tab panel: show ZIP actions immediately instead of a collapsed disclosure. */
  readonly expanded?: boolean;
};

function bundleDownloadCopyAndAction(
  blockedHintId: string,
  downloadsDisabled: boolean,
  busy: boolean,
  onDownload: () => void,
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
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={downloadsDisabled || busy}
          aria-describedby={downloadsDisabled ? blockedHintId : undefined}
          onClick={onDownload}
        >
          {busy ? "Downloading…" : "Download finalized review"}
        </Button>
      </div>
    </>
  );
}

/** Bundle ZIP download — disclosure on stacked layouts, open card when it is the whole tab. */
export function ManifestBuyerBundleDownloadSection(props: ManifestBuyerBundleDownloadSectionProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const manifestBuyerBundleDownloadOpenParam = searchParams.get("manifestBuyerBundleDownloadOpen");
  const [bundleOpen, setBundleOpenState] = useState(() =>
    parseManifestBuyerBundleDownloadOpenFromSearch(manifestBuyerBundleDownloadOpenParam),
  );
  const { manifestId, runId, expanded } = props;
  const [busy, setBusy] = useState(false);
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: runId.trim(),
    manifestVersion: manifestId.trim(),
  });
  const deliverableDisabledReason =
    sealedManifestBlockedReason === null ? null : whyDisabledNeedsPrerequisite(sealedManifestBlockedReason);
  const blockedHintId = "manifest-buyer-bundle-download-blocked-hint";
  const downloadsDisabled = deliverableDisabledReason !== null;

  const onDownload = useCallback(() => {
    if (downloadsDisabled) {
      return;
    }

    setBusy(true);

    void downloadArtifactBundleZip(manifestId)
      .catch((error: unknown) => {
        showError(
          "Bundle download",
          error instanceof Error ? error.message : "Could not download artifact bundle.",
        );
      })
      .finally(() => {
        setBusy(false);
      });
  }, [downloadsDisabled, manifestId]);

  const syncBundleOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        manifestBuyerBundleDownloadDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setBundleOpen = useCallback(
    (open: boolean) => {
      setBundleOpenState(open);
      syncBundleOpenToUrl(open);
    },
    [syncBundleOpenToUrl],
  );

  useEffect(() => {
    setBundleOpenState(parseManifestBuyerBundleDownloadOpenFromSearch(manifestBuyerBundleDownloadOpenParam));
  }, [manifestBuyerBundleDownloadOpenParam]);

  const action = bundleDownloadCopyAndAction(blockedHintId, downloadsDisabled, busy, onDownload);

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
      open={bundleOpen}
      onToggle={(event) => {
        setBundleOpen(event.currentTarget.open);
      }}
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
