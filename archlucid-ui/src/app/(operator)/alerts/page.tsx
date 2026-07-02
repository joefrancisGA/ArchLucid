import { Suspense } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  const tab = readSearchParam(resolved, "tab") ?? "inbox";
  const initialInboxModel =
    tab === "inbox"
      ? await loadAlertsInboxPageModel({
          status: readSearchParam(resolved, "status"),
          page: readSearchParam(resolved, "page"),
        })
      : null;

  return (
    <Suspense
      fallback={
        <p
          className={cn("p-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alerts-hub-suspense-fallback"
        >
          Loading alerts…
        </p>
      }
    >
      <AlertsHubClient initialInboxModel={initialInboxModel} />
    </Suspense>
  );
}
