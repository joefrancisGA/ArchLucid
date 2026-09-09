"use client";

import type { ReactElement } from "react";

import {
  QUICK_SCAN_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  QUICK_SCAN_HERO_LEAD,
  QUICK_SCAN_PAGE_TITLE,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import { QuickScanScopeDisclosure } from "@/components/marketing/quick-scan/QuickScanScopeDisclosure";
import { SeeItDeliverablePreview } from "@/app/(marketing)/see-it/SeeItDeliverablePreview";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { MARKETING_MOTION, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { QUICK_SCAN_CLAIM_DISCIPLINE } from "@/lib/quick-scan-evidence-copy";
import { cn } from "@/lib/utils";

/** Hero band for `/quick-scan` — headline, intro lead, claim discipline, and deliverable preview. */
export function QuickScanHeroSection(): ReactElement {
  return (
    <>
      <section
        className={cn(
          "grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12",
          MARKETING_MOTION.revealIn,
        )}
        data-testid="quick-scan-hero"
        aria-labelledby="quick-scan-hero-heading"
      >
        <div>
          <h1 id="quick-scan-hero-heading" className={MARKETING_TYPOGRAPHY.heroTitle}>
            {QUICK_SCAN_PAGE_TITLE}
          </h1>
          <p
            className={cn("mt-4 text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}
            data-testid="quick-scan-intro"
          >
            {QUICK_SCAN_HERO_LEAD}
          </p>
          <PageHeaderClaimDiscipline
            text={QUICK_SCAN_CLAIM_DISCIPLINE}
            testId={QUICK_SCAN_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            className="mt-4 max-w-prose text-left"
          />
        </div>

        <SeeItDeliverablePreview />
      </section>

      <QuickScanScopeDisclosure />
    </>
  );
}
