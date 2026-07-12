import type { Metadata } from "next";

import { TeamsNotificationsIntegrationPageClient } from "./_sections/TeamsNotificationsIntegrationPageClient";
import { loadTeamsNotificationsIntegrationPageData } from "./_sections/load-teams-notifications-integration-page-data";

export const metadata: Metadata = {
  title: "Microsoft Teams notifications",
};

export default async function TeamsNotificationsIntegrationPage() {
  const loaded = await loadTeamsNotificationsIntegrationPageData();

  return <TeamsNotificationsIntegrationPageClient loaded={loaded} />;
}
