"use client";

import type { ReactElement } from "react";

import {
  QUICK_SCAN_BUYER_OVERVIEW,
  QUICK_SCAN_FIRST_VIEWPORT_TEST_ID,
  QUICK_SCAN_LAST_REVIEWED_LABEL,
  QUICK_SCAN_SKIP_TARGET_ID,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import { QuickScanHeroSection } from "@/app/(marketing)/quick-scan/QuickScanHeroSection";
import { QuickScanPageChrome } from "@/app/(marketing)/quick-scan/QuickScanPageChrome";
import { QuickScanResultsSection } from "@/app/(marketing)/quick-scan/QuickScanResultsSection";
import { QuickScanWorkspaceSection } from "@/app/(marketing)/quick-scan/QuickScanWorkspaceSection";
import { useQuickScanClient } from "@/app/(marketing)/quick-scan/use-quick-scan-client";
import { QuickScanSourcesOrientationStrip } from "@/components/marketing/QuickScanSourcesOrientationStrip";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { QUICK_SCAN_REVISION_HISTORY } from "@/lib/quick-scan-marketing-revision-history";
import { TRUST_CENTER_PUBLIC_EVIDENCE_VERSION } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";
import { cn } from "@/lib/utils";

/**
 * No-sign-in Quick Scan: POST /v1/marketing/quick-scan via same-origin proxy (no privileged bearer).
 */
export function QuickScanClient(): ReactElement {
  const client = useQuickScanClient();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12" data-testid="quick-scan-page">
      <QuickScanPageChrome>
        <div
          id={QUICK_SCAN_SKIP_TARGET_ID}
          data-testid={QUICK_SCAN_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
          )}
        >
          <QuickScanHeroSection />
        </div>

        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}
          data-testid="quick-scan-overview"
        >
          {QUICK_SCAN_BUYER_OVERVIEW}
        </p>

        <QuickScanWorkspaceSection client={client} />
        <QuickScanResultsSection client={client} />

        <div className={TRUST_CENTER_PUBLIC_LAYOUT.metaRow} data-testid="quick-scan-page-meta">
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.lastReviewed}>
            Last reviewed{" "}
            <time dateTime={QUICK_SCAN_LAST_REVIEWED_LABEL}>{QUICK_SCAN_LAST_REVIEWED_LABEL}</time>
          </span>
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.metaSecondary}>
            Demonstration pack version {TRUST_CENTER_PUBLIC_EVIDENCE_VERSION}
          </span>
        </div>

        <TrustCenterRevisionHistory entries={QUICK_SCAN_REVISION_HISTORY} />

        <QuickScanSourcesOrientationStrip />
      </QuickScanPageChrome>
    </div>
  );
}
