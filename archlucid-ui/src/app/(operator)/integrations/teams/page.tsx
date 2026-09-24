import type { Metadata } from "next";

import { TeamsNotificationsIntegrationPageClient } from "./_sections/TeamsNotificationsIntegrationPageClient";
import { loadTeamsNotificationsIntegrationPageData } from "./_sections/load-teams-notifications-integration-page-data";
import { productLineTeamsNotificationsPageTitle } from "@/lib/product-line/product-line-display-name";
import { resolveProductLineIdForServer } from "@/lib/product-line/resolve-product-line-id-server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: productLineTeamsNotificationsPageTitle(await resolveProductLineIdForServer()),
  };
}

export default async function TeamsNotificationsIntegrationPage() {
  const loaded = await loadTeamsNotificationsIntegrationPageData();

  return <TeamsNotificationsIntegrationPageClient loaded={loaded} />;
}
