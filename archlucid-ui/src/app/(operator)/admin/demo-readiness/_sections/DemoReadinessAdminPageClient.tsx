"use client";

import Link from "next/link";

import { DemoReadinessEvidenceOrientationStrip } from "@/app/(operator)/admin/demo-readiness/_sections/DemoReadinessEvidenceOrientationStrip";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK,
  INTERNAL_DEMO_READINESS_PAGE_LEAD,
  BUYER_CTO_DEMO_READINESS_HEADING,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_PRIMARY_SECTION_HEADING, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { cn } from "@/lib/utils";

/** Employee-only demo diagnostics — moved off the customer homepage. */
export function DemoReadinessAdminPageClient(): React.JSX.Element {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  if (isAuthorityLoading) {
    return (
      <OperatorPageContainer variant="dashboard">
        <p className={cn("text-al-text-secondary", OPERATOR_TYPE_SCALE.body)}>Loading…</p>
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
    <OperatorPageContainer variant="dashboard" className="space-y-6" data-testid="demo-readiness-admin-page">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className={OPERATOR_HOME_PRIMARY_SECTION_HEADING}>{BUYER_CTO_DEMO_READINESS_HEADING}</h1>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPE_SCALE.helper)}>
              {INTERNAL_DEMO_READINESS_PAGE_LEAD}
            </p>
          </div>
          <PageContextualHelpButton />
        </div>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/admin/health">{INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK}</Link>
        </Button>
      </header>
      <DemoReadinessEvidenceOrientationStrip />
      <BuyerCtoDemoReadinessPanel layout="internal-page" />
    </OperatorPageContainer>
  );
}
