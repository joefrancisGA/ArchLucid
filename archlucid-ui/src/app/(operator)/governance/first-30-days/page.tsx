import type { Metadata } from "next";
import Link from "next/link";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "First 30 days — governance operating preset",
};

/**
 * Guided adoption path after Core Pilot: inspect-first links to policy, routing, and dashboards (no forced mutations).
 */
export default function FirstThirtyDaysGovernancePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader
        title="First 30 days — governance operating preset"
        subtitle="A minimal enterprise rhythm: one policy baseline, one alert route, one approval SLA story, and one dashboard anchor."
      />
      <LayerHeader pageKey="governance-first-30-days" />

      <ol className="m-0 list-decimal space-y-4 pl-5 text-sm text-neutral-800 dark:text-neutral-200">
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Policy pack baseline</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <p className="m-0">Assign a published pack and confirm effective thresholds for your workspace.</p>
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/governance/policy-packs">
                Open policy packs
              </Link>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Preview threshold impact (read-safe)</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <p className="m-0">Run a dry-run from a pack detail page before changing production thresholds.</p>
              <p className="m-0 text-neutral-500 dark:text-neutral-400">Use Policy packs → select a pack → Dry-run.</p>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Alert route &amp; owner loop</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <p className="m-0">Wire one routing subscription per severity class your team actually answers.</p>
              <div className="flex flex-wrap gap-3">
                <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/alerts">
                  Alerts inbox
                </Link>
                <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/integrations/operations">
                  Connector readiness
                </Link>
              </div>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Approvals &amp; SLA narrative</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <p className="m-0">Start with a single promotion path and document expected acknowledgement times for architects.</p>
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/governance">
                Governance workflow
              </Link>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Workspace overview anchor</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <p className="m-0">
                One sponsor-facing page for pre-commit posture, severity exposure in reports, drift, approval SLAs, and a
                hours-first value proxy — scoped to this workspace session.
              </p>
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/governance/dashboard">
                Open workspace overview
              </Link>
            </CardContent>
          </Card>
        </li>
      </ol>
    </div>
  );
}
