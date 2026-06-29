import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { LayerHeader } from "@/components/LayerHeader";
import { cn } from "@/lib/utils";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "First 30 days — governance operating preset",
};

/**
 * Guided adoption path after Core Pilot: inspect-first links to policy, routing, and dashboards (no forced mutations).
 */
export default function FirstThirtyDaysGovernancePage() {
  return (
    <div className="w-full max-w-3xl space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader
        title="First 30 days — governance operating preset"
        subtitle="A minimal enterprise rhythm: one policy baseline, one alert route, one approval SLA story, and one dashboard anchor."
      />
      <LayerHeader pageKey="governance-first-30-days" />

      <ol className={cn("m-0 list-decimal space-y-4 pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Policy pack baseline
              </h2>
            </CardHeader>
            <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0">Assign a published pack and confirm effective thresholds for your workspace.</p>
              <Link className={OPERATOR_LINK.nav} href="/governance/policy-packs">
                Open policy packs
              </Link>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Preview threshold impact (read-safe)
              </h2>
            </CardHeader>
            <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0">Run a dry-run from a pack detail page before changing production thresholds.</p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Use Policy packs → select a pack → Dry-run.
              </p>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Alert route &amp; owner loop
              </h2>
            </CardHeader>
            <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0">Wire one routing subscription per severity class your team actually answers.</p>
              <div className="flex flex-wrap gap-3">
                <Link className={OPERATOR_LINK.nav} href="/alerts">
                  Alerts inbox
                </Link>
                <Link className={OPERATOR_LINK.nav} href={INTEGRATIONS_READINESS_PATH}>
                  Connector readiness
                </Link>
              </div>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Approvals &amp; SLA narrative
              </h2>
            </CardHeader>
            <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0">
                Start with a single promotion path and document expected acknowledgement times for architects.
              </p>
              <Link className={OPERATOR_LINK.nav} href="/governance">
                Governance workflow
              </Link>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card>
            <CardHeader className="pb-2">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Workspace overview anchor
              </h2>
            </CardHeader>
            <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0">
                One sponsor-facing page for pre-commit posture, severity exposure in reports, drift, approval SLAs, and a
                hours-first value proxy — scoped to this workspace session.
              </p>
              <Link className={OPERATOR_LINK.nav} href="/governance/dashboard">
                Open workspace overview
              </Link>
            </CardContent>
          </Card>
        </li>
      </ol>
    </div>
  );
}
