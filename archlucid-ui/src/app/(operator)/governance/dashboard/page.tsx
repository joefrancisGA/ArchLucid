import Link from "next/link";

import { HelpLink } from "@/components/HelpLink";
import { ContextualHelp } from "@/components/ContextualHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Placeholder until the cross-run governance dashboard ships — direct visits only (not linked from product nav).
 */
export default function GovernanceDashboardPage() {
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
        Cross-run approvals and lineage summaries are <strong>coming soon</strong>. Use governance workflow, findings, and
        audit log for current reviews today.
      </p>
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="space-y-4 px-6 py-8">
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            When this view ships, it will summarize pending approvals and traceability across reviews in one place.
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
