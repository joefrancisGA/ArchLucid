import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AlertsInboxPanelSkeleton } from "@/components/skeletons/AlertsInboxPanelSkeleton";
import { isAlertConfigurationTabParam } from "@/lib/alerts-hub-tab";
import {
  buildCanonicalGovernanceAlertsInboxHref,
  governanceAlertRulesTabHref,
} from "@/lib/governance/governance-route-paths";

import { AlertsInboxStreamingBody } from "./_sections/AlertsInboxStreamingBody";
import { AlertsHubChrome } from "./AlertsHubChrome";

type AlertsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

/**
 * Alerts hub — sync redirects + chrome, then stream inbox under Suspense (TB-2026).
 * Bare `/governance/alerts` is the inbox; legacy `?tab=inbox` canonicalizes here (TB-1594).
 */
export default async function AlertsPage(props: AlertsPageProps) {
  const resolved = await props.searchParams;
  const tab = readSearchParam(resolved, "tab");

  if (tab === "inbox") {
    redirect(buildCanonicalGovernanceAlertsInboxHref(resolved));
  }

  if (isAlertConfigurationTabParam(tab)) {
    redirect(governanceAlertRulesTabHref(tab ?? "rules"));
  }

  const status = readSearchParam(resolved, "status");
  const cursor = readSearchParam(resolved, "cursor");

  return (
    <AlertsHubChrome>
      <Suspense fallback={<AlertsInboxPanelSkeleton />}>
        <AlertsInboxStreamingBody status={status} cursor={cursor} />
      </Suspense>
    </AlertsHubChrome>
  );
}
