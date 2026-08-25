"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTransition } from "react";

import { cn } from "@/lib/utils";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { PlanningPlanDetailHubVocabularyRail } from "@/components/PlanningPlanDetailHubVocabularyRail";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PLANNING_PATH } from "@/lib/planning-route";
import {
  PLANNING_PLAN_DETAIL_LOAD_RETRY_LABEL,
  PLANNING_PLAN_DETAIL_MISSING_PLAN_ID_BODY,
  PLANNING_PLAN_DETAIL_MISSING_PLAN_ID_TITLE,
  planningPlanDetailPageSubtitle,
} from "@/lib/planning-plan-detail-evidence-copy";
import { resolveNextPlanInTheme } from "@/lib/resolve-next-plan-in-theme";

import { PlanningLoadFailurePanel } from "../../../_sections/PlanningLoadFailurePanel";
import { PlanningPlanDetailBuyerChrome } from "./PlanningPlanDetailBuyerChrome";
import { PlanningPlanDetailNextPlanFooter } from "./PlanningPlanDetailNextPlanFooter";
import { PlanningPlanDetailPageHeader } from "./PlanningPlanDetailPageHeader";
import { PlanningPlanDetailSections } from "./PlanningPlanDetailSections";
import type { UsePlanningPlanDetailPageModel } from "./use-planning-plan-detail-page";

type PlanningPlanDetailPageViewProps = {
  model: UsePlanningPlanDetailPageModel;
};

export function PlanningPlanDetailPageView({ model }: PlanningPlanDetailPageViewProps) {
  const router = useRouter();
  const [refreshing, startRefreshTransition] = useTransition();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { failure, plan, planId, plans } = model;
  const trimmedPlanId = planId.trim();
  const missingPlanId = trimmedPlanId.length === 0;
  const nextPlanInTheme = useMemo(() => {
    if (plan === null) {
      return null;
    }

    return resolveNextPlanInTheme(plans, plan.planId, plan.themeId);
  }, [plan, plans]);

  const refreshPlan = (): void => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="max-w-3xl space-y-4">
      <PlanningPlanDetailPageHeader
        subtitle={planningPlanDetailPageSubtitle(buyerPolishedShell)}
        planId={trimmedPlanId.length > 0 ? trimmedPlanId : "plan"}
        planLabel={plan?.title ?? null}
        createdUtc={plan?.createdUtc ?? null}
        refreshing={refreshing}
        onRefresh={refreshPlan}
      />

      {!buyerPolishedShell ? <PlanningPlanDetailHubVocabularyRail currentSurfaceId="plan-detail" /> : null}

      <PlanningPlanDetailBuyerChrome />

      {missingPlanId ? (
        <EnterpriseCompactEmptyState
          testId="planning-plan-detail-missing-plan-id"
          title={PLANNING_PLAN_DETAIL_MISSING_PLAN_ID_TITLE}
          description={PLANNING_PLAN_DETAIL_MISSING_PLAN_ID_BODY}
          footer={
            <Link className={OPERATOR_LINK.optional} href={PLANNING_PATH}>
              Back to Improvement planning
            </Link>
          }
        />
      ) : null}

      {!missingPlanId && failure !== null ? (
        <PlanningLoadFailurePanel
          failure={failure}
          retryLabel={PLANNING_PLAN_DETAIL_LOAD_RETRY_LABEL}
          testId="planning-plan-detail-load-failure"
          retryTestId="planning-plan-detail-load-retry"
          retryDisabled={refreshing}
          onRetry={refreshPlan}
        />
      ) : null}

      {!missingPlanId && failure === null && plan === null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
          Plan not found for this workspace.
        </p>
      ) : null}

      {!missingPlanId && failure === null && plan !== null ? <PlanningPlanDetailSections plan={plan} /> : null}

      {nextPlanInTheme !== null ? <PlanningPlanDetailNextPlanFooter plan={nextPlanInTheme} /> : null}
    </div>
  );
}
