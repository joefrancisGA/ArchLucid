"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { DemoReadinessAdminPageLoadingSkeleton } from "@/app/(operator)/internal/demo-readiness/_sections/DemoReadinessAdminPageLoadingSkeleton";
import { DemoReadinessToolingDisabledEmptyState } from "@/app/(operator)/internal/demo-readiness/_sections/DemoReadinessToolingDisabledEmptyState";
import { DemoReadinessEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  BuyerCtoDemoReadinessPanel,
  type DemoReadinessRecheckControls,
} from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { TrialFunnelDemoReadinessVocabularyRail } from "@/components/trial/TrialFunnelDemoReadinessVocabularyRail";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  BUYER_CTO_DEMO_READINESS_REFRESH_CTA,
  INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK,
  INTERNAL_DEMO_READINESS_PAGE_LEAD,
} from "@/lib/buyer/buyer-polish-copy";
import {
  INTERNAL_DEMO_READINESS_PAGE_TITLE,
  INTERNAL_OPERATIONS_NAV_EYEBROW,
} from "@/lib/demo-readiness-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { INTERNAL_DEMO_READINESS_PATH, INTERNAL_HEALTH_PATH } from "@/lib/internal-ops-route-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isCtoDemoOperatorToolingEnv } from "@/lib/cto-demo-presenter-pack";
import { cn } from "@/lib/utils";

/** Employee-only demo diagnostics — moved off the customer homepage. */
export function DemoReadinessAdminPageClient(): React.JSX.Element {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const demoOperatorToolingEnabled = isCtoDemoOperatorToolingEnv();
  const [recheckControls, setRecheckControls] = useState<DemoReadinessRecheckControls | null>(null);

  const handleRecheckControlsChange = useCallback((controls: DemoReadinessRecheckControls) => {
    setRecheckControls(controls);
  }, []);

  if (isAuthorityLoading) {
    return (
      <OperatorPageContainer variant="dashboard">
        <DemoReadinessAdminPageLoadingSkeleton />
      </OperatorPageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <OperatorPageContainer variant="dashboard">
        <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPE_SCALE.body)} role="alert">
          This page requires tenant administrator access (AdminAuthority).
        </p>
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="demo-readiness-admin-page">
      <PageHeading
        navHref={INTERNAL_DEMO_READINESS_PATH}
        title={INTERNAL_DEMO_READINESS_PAGE_TITLE}
        titleTestId="demo-readiness-admin-page-title"
        metadata={
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)} data-testid="demo-readiness-admin-ops-eyebrow">
            {INTERNAL_OPERATIONS_NAV_EYEBROW}
          </p>
        }
        description={INTERNAL_DEMO_READINESS_PAGE_LEAD}
        actions={
          demoOperatorToolingEnabled ? (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-8"
                data-testid="demo-readiness-admin-recheck-cta"
                disabled={recheckControls === null || recheckControls.loading}
                onClick={() => {
                  recheckControls?.runChecks();
                }}
              >
                {BUYER_CTO_DEMO_READINESS_REFRESH_CTA}
              </Button>
              <PageContextualHelpButton />
            </>
          ) : (
            <PageContextualHelpButton />
          )
        }
        data-testid="demo-readiness-admin-page-heading"
      >
        {demoOperatorToolingEnabled ? (
          <Link
            href={INTERNAL_HEALTH_PATH}
            className={cn(
              "inline-flex text-al-text-secondary underline-offset-2 hover:text-al-text-primary hover:underline",
              OPERATOR_TYPE_SCALE.body,
            )}
            data-testid="demo-readiness-admin-diagnostics-link"
          >
            {INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK}
          </Link>
        ) : null}
      </PageHeading>
      <DemoReadinessEvidenceOrientationStrip />
      <TrialFunnelDemoReadinessVocabularyRail currentSurfaceId="demo-readiness" />
      {demoOperatorToolingEnabled ? (
        <BuyerCtoDemoReadinessPanel
          layout="internal-page"
          recheckPlacement="page"
          onRecheckControlsChange={handleRecheckControlsChange}
        />
      ) : (
        <DemoReadinessToolingDisabledEmptyState />
      )}
    </OperatorPageContainer>
  );
}
