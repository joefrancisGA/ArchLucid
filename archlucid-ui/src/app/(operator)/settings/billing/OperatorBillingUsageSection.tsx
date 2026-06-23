"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LlmBudgetUtilizationMeter } from "@/components/LlmBudgetUtilizationMeter";

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
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Usage and overages
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Included reviews, architect seats, and AI usage for the current UTC month. Overage charges apply after included
          allocations are consumed.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly AI usage</CardTitle>
          <CardDescription>
            Tracks AI analysis spend against your plan&apos;s included monthly allocation and any purchased credits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <LlmBudgetUtilizationMeter refreshToken={refreshToken} />
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            Detailed cost breakdowns live in{" "}
            <Link href="/settings/cost-reporting" className="font-medium text-teal-800 underline dark:text-teal-300">
              Settings → Cost reporting
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
