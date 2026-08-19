"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LlmBudgetUtilizationMeter } from "@/components/llm/LlmBudgetUtilizationMeter";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { invalidateLlmMonthlyBudgetStatusCache } from "@/lib/llm-monthly-budget-status";
import {
  BILLING_AI_USAGE_SECTION_INTRO,
  BILLING_MONTHLY_AI_USAGE_CARD_DESCRIPTION,
} from "@/lib/vocabulary/billing-meter-vocabulary";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function OperatorBillingUsageSection() {
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === "#billing-usage") {
        void invalidateLlmMonthlyBudgetStatusCache();
      }
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return (
    <section id="billing-usage" className="scroll-mt-24 space-y-3" data-testid="operator-billing-usage-section">
      <div>
        <h2 className={OPERATOR_NAV_GROUP_LABEL}>AI usage and credits</h2>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{BILLING_AI_USAGE_SECTION_INTRO}</p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Monthly AI usage</CardTitle>
          <CardDescription>{BILLING_MONTHLY_AI_USAGE_CARD_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <LlmBudgetUtilizationMeter />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Detailed cost breakdowns live in{" "}
            <Link href={AI_USAGE_SETTINGS_PATH} className={OPERATOR_LINK.nav}>
              Administration → AI usage
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
