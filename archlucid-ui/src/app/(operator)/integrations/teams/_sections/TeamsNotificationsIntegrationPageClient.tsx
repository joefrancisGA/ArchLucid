"use client";

import type { TeamsNotificationsIntegrationPageServerLoad } from "./load-teams-notifications-integration-page-data";
import { TeamsNotificationsIntegrationPageView } from "./TeamsNotificationsIntegrationPageView";
import { useTeamsNotificationsIntegrationPage } from "./use-teams-notifications-integration-page";

type Props = {
  readonly loaded: TeamsNotificationsIntegrationPageServerLoad;
};

/** Client root; GET pair is prefetched from `page.tsx` outside demo mode. */
export function TeamsNotificationsIntegrationPageClient(props: Props) {
  const model = useTeamsNotificationsIntegrationPage(props.loaded);

  return <TeamsNotificationsIntegrationPageView model={model} />;
}
