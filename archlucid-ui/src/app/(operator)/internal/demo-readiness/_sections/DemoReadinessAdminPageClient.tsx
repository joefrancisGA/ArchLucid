"use client";

import Link from "next/link";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK,
  INTERNAL_DEMO_READINESS_PAGE_LEAD,
} from "@/lib/buyer-polish-copy";
import {
  INTERNAL_DEMO_READINESS_PAGE_TITLE,
  INTERNAL_OPERATIONS_NAV_EYEBROW,
} from "@/lib/demo-readiness-evidence-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { INTERNAL_DEMO_READINESS_PATH } from "@/lib/internal-ops-route-paths";
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
      <PageHeading
        navHref={INTERNAL_DEMO_READINESS_PATH}
        title={INTERNAL_DEMO_READINESS_PAGE_TITLE}
        titleTestId="demo-readiness-admin-page-title"
        metadata={
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.eyebrow)} data-testid="demo-readiness-admin-ops-eyebrow">
            {INTERNAL_OPERATIONS_NAV_EYEBROW}
          </p>
        }
        description={INTERNAL_DEMO_READINESS_PAGE_LEAD}
        actions={<PageContextualHelpButton />}
        data-testid="demo-readiness-admin-page-heading"
      >
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/internal/health">{INTERNAL_DEMO_READINESS_DIAGNOSTICS_LINK}</Link>
        </Button>
      </PageHeading>
      <BuyerCtoDemoReadinessPanel layout="internal-page" />
    </OperatorPageContainer>
  );
}
