import { redirect } from "next/navigation";

import { isAlertConfigurationTabParam, shouldCanonicalizeAlertsInboxTabParam, buildAlertsInboxCanonicalHref } from "@/lib/alerts-hub-tab";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

import { loadAlertsInboxPageModel } from "./_sections/load-alerts-inbox-page-model";
import { AlertsHubClient } from "./AlertsHubClient";

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

export default async function AlertsPage(props: AlertsPageProps) {
  const resolved = await props.searchParams;
  const tab = readSearchParam(resolved, "tab");

  if (isAlertConfigurationTabParam(tab)) {
    redirect(governanceAlertRulesTabHref(tab ?? "rules"));
  }

  if (shouldCanonicalizeAlertsInboxTabParam(tab)) {
    redirect(
      buildAlertsInboxCanonicalHref({
        status: readSearchParam(resolved, "status"),
        page: readSearchParam(resolved, "page"),
      }),
    );
  }

  const initialInboxModel = await loadAlertsInboxPageModel({
    status: readSearchParam(resolved, "status"),
    page: readSearchParam(resolved, "page"),
  });

  return <AlertsHubClient initialInboxModel={initialInboxModel} />;
}
