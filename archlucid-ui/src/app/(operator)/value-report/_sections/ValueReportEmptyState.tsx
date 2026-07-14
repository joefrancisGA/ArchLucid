"use client";

import Link from "next/link";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import {
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  BUYER_VALUE_REPORT_EMPTY_DESCRIPTION,
  BUYER_VALUE_REPORT_EMPTY_TITLE,
  BUYER_VIEW_SAMPLE_VALUE_REPORT_CTA,
} from "@/lib/buyer-polish-copy";

/** Empty state when the selected report period has no finalized reviews. */
export function ValueReportEmptyState(): React.JSX.Element {
  return (
    <EnterpriseCompactEmptyState
      testId="value-report-empty-state"
      title={BUYER_VALUE_REPORT_EMPTY_TITLE}
      description={BUYER_VALUE_REPORT_EMPTY_DESCRIPTION}
      actions={[
        { label: "Open reviews", href: "/reviews?projectId=default", variant: "primary" },
        { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/reviews/new", variant: "outline" },
      ]}
      footer={
        <Button asChild size="sm" variant="outline" className="border-neutral-300 dark:border-neutral-600">
          <Link href="/value-report/pilot">{BUYER_VIEW_SAMPLE_VALUE_REPORT_CTA}</Link>
        </Button>
      }
    />
  );
}
