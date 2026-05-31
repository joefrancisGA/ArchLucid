import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RunDetailExecutiveSummaryCtaCardProps = {
  readonly runId: string;
};

/** Buyer-polished CTA that jumps to the executive summary route before manifest drill-down. */
export function RunDetailExecutiveSummaryCtaCard(props: RunDetailExecutiveSummaryCtaCardProps) {
  const { runId } = props;

  return (
    <Card className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-al-text-primary">
          Executive Summary
        </CardTitle>
        <CardDescription>
          Board-ready risk posture, evidence basis, and governance status. Start here before manifest detail and
          deliverables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Button type="button" variant="primary" asChild>
          <Link href={`/executive/reviews/${encodeURIComponent(runId)}`}>Open Executive Summary</Link>
        </Button>
        <p className="m-0">
          <Link
            href="#manifest-summary"
            className="text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
          >
            or view manifest summary →
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
