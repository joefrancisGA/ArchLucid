import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";

import type { AlertsInboxSearchParams } from "./alerts-inbox-page-model";
import { loadAlertsInboxPageModel } from "./load-alerts-inbox-page-model";

type AlertsInboxStreamingBodyProps = {
  readonly status?: string;
  readonly page?: string;
};

/** Async RSC: loads inbox page model then hydrates the interactive inbox (TB-2026). */
export async function AlertsInboxStreamingBody(
  props: AlertsInboxStreamingBodyProps,
): Promise<React.JSX.Element> {
  const search: AlertsInboxSearchParams = {
    status: props.status,
    page: props.page,
  };
  const initialInboxModel = await loadAlertsInboxPageModel(search);

  return <AlertsInboxContent initialModel={initialInboxModel} />;
}
