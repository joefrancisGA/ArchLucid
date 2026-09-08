"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { getBundleDownloadUrl } from "@/lib/api";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY,
  BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE,
  BUYER_MANIFEST_DOWNLOAD_REVIEW_PACKAGE_ZIP,
} from "@/lib/buyer/buyer-polish-copy";
import {
  manifestDetailDecisionsDisclosureHrefFromSearch,
  parseManifestDetailDecisionsOpenFromSearch,
} from "@/lib/governance/manifest-detail-decisions-disclosure-url";
import {
  manifestDetailWarningsDisclosureHrefFromSearch,
  parseManifestDetailWarningsOpenFromSearch,
} from "@/lib/governance/manifest-detail-warnings-disclosure-url";
import {
  manifestSummaryBundleDownloadDisclosureHrefFromSearch,
  parseManifestSummaryBundleDownloadOpenFromSearch,
} from "@/lib/governance/manifest-summary-bundle-download-disclosure-url";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { whyDisabledNeedsPrerequisite } from "@/lib/why-disabled-cta";
import {
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES,
} from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import type { ManifestSummary } from "@/types/authority";

export type ManifestDetailSummaryDecisionsBlocksProps = {
  readonly summary: ManifestSummary;
  readonly buyerPolishedLayout: boolean;
  readonly detailOpenDefault: boolean;
};

export function ManifestDetailSummaryDecisionsBlock({
  summary,
  buyerPolishedLayout,
  detailOpenDefault,
}: ManifestDetailSummaryDecisionsBlocksProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const manifestDetailDecisionsOpenParam = searchParams.get("manifestDetailDecisionsOpen");
  const [decisionsOpen, setDecisionsOpenState] = useState(
    () => parseManifestDetailDecisionsOpenFromSearch(manifestDetailDecisionsOpenParam) || detailOpenDefault,
  );
  const isCuratedDemo = summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID;
  const decisionLinesAll = isCuratedDemo ? [...SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES] : [];
  const decisionLinesPreview = decisionLinesAll.slice(0, 3);
  const decisionRestCount = Math.max(0, decisionLinesAll.length - decisionLinesPreview.length);

  const syncDecisionsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        manifestDetailDecisionsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setDecisionsOpen = useCallback(
    (open: boolean) => {
      setDecisionsOpenState(open);
      syncDecisionsOpenToUrl(open);
    },
    [syncDecisionsOpenToUrl],
  );

  useEffect(() => {
    setDecisionsOpenState(parseManifestDetailDecisionsOpenFromSearch(manifestDetailDecisionsOpenParam));
  }, [manifestDetailDecisionsOpenParam]);

  const decisionsSummaryLabel =
    buyerPolishedLayout
      ? `Decisions in this package (${summary.decisionCount})`
      : `Decisions recorded (${summary.decisionCount})`;

  return (
    <details
      className="rounded-lg border border-neutral-200 dark:border-neutral-800"
      open={decisionsOpen}
      onToggle={(event) => {
        setDecisionsOpen(event.currentTarget.open);
      }}
    >
      <summary className={cn("cursor-pointer select-none px-3 py-2 text-neutral-900 dark:text-neutral-100", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {decisionsSummaryLabel}
      </summary>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {decisionLinesPreview.length > 0 ? (
          <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {decisionLinesPreview.map((line, index) => (
              <li key={`decision-${index}`}>{line}</li>
            ))}
          </ol>
        ) : summary.decisionCount > 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Full decision text is included in the{" "}
            <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${summary.runId}`}>
              architecture review export
            </Link>{" "}
            and evidence bundle — use the download actions on this page when available.
          </p>
        ) : (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No decisions recorded for this finalized review record.</p>
        )}
        {decisionRestCount > 0 ? (
          <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            … and {decisionRestCount} more decisions in the export package — open review detail or download the evidence
            package for the full list.
          </p>
        ) : null}
      </div>
    </details>
  );
}

export function ManifestDetailSummaryWarningsBlock({
  summary,
  buyerPolishedLayout,
  detailOpenDefault,
}: ManifestDetailSummaryDecisionsBlocksProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const manifestDetailWarningsOpenParam = searchParams.get("manifestDetailWarningsOpen");
  const [warningsOpen, setWarningsOpenState] = useState(
    () => parseManifestDetailWarningsOpenFromSearch(manifestDetailWarningsOpenParam) || detailOpenDefault,
  );
  const isCuratedDemo = summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID;
  const warningLines = isCuratedDemo ? [...SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES] : [];

  const syncWarningsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        manifestDetailWarningsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setWarningsOpen = useCallback(
    (open: boolean) => {
      setWarningsOpenState(open);
      syncWarningsOpenToUrl(open);
    },
    [syncWarningsOpenToUrl],
  );

  useEffect(() => {
    setWarningsOpenState(parseManifestDetailWarningsOpenFromSearch(manifestDetailWarningsOpenParam));
  }, [manifestDetailWarningsOpenParam]);

  const warningsSummaryLabel =
    buyerPolishedLayout
      ? `Monitored risks in this package (${summary.warningCount})`
      : `Warnings (${summary.warningCount})`;

  return (
    <details
      className="rounded-lg border border-neutral-200 dark:border-neutral-800"
      open={warningsOpen}
      onToggle={(event) => {
        setWarningsOpen(event.currentTarget.open);
      }}
    >
      <summary className={cn("cursor-pointer select-none px-3 py-2 text-neutral-900 dark:text-neutral-100", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {warningsSummaryLabel}
      </summary>
      <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {warningLines.length > 0 ? (
          <ul className={cn("m-0 list-disc space-y-2 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {warningLines.map((line, index) => (
              <li key={`warning-${index}`}>{line}</li>
            ))}
          </ul>
        ) : summary.warningCount > 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Monitored-risk detail travels with the evidence bundle — use{" "}
            <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${summary.runId}`}>
              review detail
            </Link>{" "}
            or download the bundle.
          </p>
        ) : (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No monitored risks recorded on this finalized review record.</p>
        )}
      </div>
    </details>
  );
}

export type ManifestDetailSummaryBundleDownloadProps = {
  readonly summary: ManifestSummary;
};

export function ManifestDetailSummaryBundleDownload({
  summary,
}: ManifestDetailSummaryBundleDownloadProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const manifestSummaryBundleDownloadOpenParam = searchParams.get("manifestSummaryBundleDownloadOpen");
  const [bundleOpen, setBundleOpenState] = useState(() =>
    parseManifestSummaryBundleDownloadOpenFromSearch(manifestSummaryBundleDownloadOpenParam),
  );
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: summary.runId.trim(),
    manifestVersion: summary.manifestId.trim(),
  });
  const deliverableDisabledReason =
    sealedManifestBlockedReason === null ? null : whyDisabledNeedsPrerequisite(sealedManifestBlockedReason);
  const blockedHintId = "manifest-summary-bundle-download-blocked-hint";
  const downloadsDisabled = deliverableDisabledReason !== null;

  const syncBundleOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        manifestSummaryBundleDownloadDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
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
    setBundleOpenState(parseManifestSummaryBundleDownloadOpenFromSearch(manifestSummaryBundleDownloadOpenParam));
  }, [manifestSummaryBundleDownloadOpenParam]);

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
      <summary className={cn(
        "cursor-pointer select-none px-3 py-2 outline-none marker:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:text-neutral-100",
        OPERATOR_DISCLOSURE_TRIGGER_CLASS,
      )}>
        {BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY}
      </summary>
      <div className="space-y-3 border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
        {deliverableDisabledReason !== null ? (
          <WhyDisabledCtaHint id={blockedHintId} reason={deliverableDisabledReason} />
        ) : null}
        <p className={cn("m-0 max-w-prose text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          Prefer the consolidated bundle for diligence and archiving — it packages the downloadable outputs that align
          to the decisions and posture summarized above.
        </p>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {downloadsDisabled ? (
            <Button variant="primary" size="sm" disabled aria-describedby={blockedHintId}>
              {BUYER_MANIFEST_DOWNLOAD_REVIEW_PACKAGE_ZIP}
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <a href={getBundleDownloadUrl(summary.manifestId)}>{BUYER_MANIFEST_DOWNLOAD_REVIEW_PACKAGE_ZIP}</a>
            </Button>
          )}
        </div>
      </div>
    </details>
  );
}
