import Link from "next/link";

import { HelpLink } from "@/components/HelpLink";
import { ContextualHelp } from "@/components/ContextualHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/**
 * Placeholder until the cross-run governance dashboard ships — direct visits only (not linked from product nav).
 */
export default function GovernanceDashboardPage() {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Governance dashboard not available in demo mode.</p>
        <p className="m-0 mt-1">Use the <Link className="font-medium underline" href="/governance">governance workflow</Link> and <Link className="font-medium underline" href="/audit">audit log</Link> for current reviews.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Governance dashboard</h1>
        <ContextualHelp helpKey="governance-dashboard" />
        <HelpLink
          docPath="/docs/library/GOVERNANCE_WORKFLOW_UI.md"
          label="Governance workflows documentation on GitHub (new tab)"
        />
      </div>
      <p className="max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        Cross-review approvals and lineage summaries are in development. Use governance workflow, findings, and
        audit log for current reviews today.
      </p>
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="space-y-4 px-6 py-8">
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            When ready, this view will summarize pending approvals and traceability across reviews in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild type="button" variant="default">
              <Link href="/governance">Open governance workflow</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/audit">Open audit log</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
