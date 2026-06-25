"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LlmBudgetUtilizationMeter } from "@/components/LlmBudgetUtilizationMeter";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function OperatorBillingUsageSection() {
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === "#billing-usage") {
        setRefreshToken((value) => value + 1);
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
        <h2 className={OPERATOR_NAV_GROUP_LABEL}>
          Usage and overages
        </h2>
        <p className={cn("mt-1 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
          Included reviews, architect seats, and AI usage for the current UTC month. Overage charges apply after included
          allocations are consumed.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Monthly AI usage</CardTitle>
          <CardDescription>
            Tracks AI analysis spend against your plan&apos;s included monthly allocation and any purchased credits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <LlmBudgetUtilizationMeter refreshToken={refreshToken} />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Detailed cost breakdowns live in{" "}
            <Link href="/settings/cost-reporting" className={OPERATOR_LINK.nav}>
              Settings → Cost reporting
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
