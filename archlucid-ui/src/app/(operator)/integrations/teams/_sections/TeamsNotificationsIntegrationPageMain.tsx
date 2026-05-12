"use client";

import { TeamsNotificationsIntegrationPageView } from "./TeamsNotificationsIntegrationPageView";
import { useTeamsNotificationsIntegrationPage } from "./use-teams-notifications-integration-page";

export function TeamsNotificationsIntegrationPageMain() {
  const model = useTeamsNotificationsIntegrationPage();

  return <TeamsNotificationsIntegrationPageView model={model} />;
}
