import type { Metadata } from "next";

import { TeamsNotificationsIntegrationPageClient } from "./_sections/TeamsNotificationsIntegrationPageClient";
import { loadTeamsNotificationsIntegrationPageData } from "./_sections/load-teams-notifications-integration-page-data";
import { productLineTeamsNotificationsPageTitle } from "@/lib/product-line/product-line-display-name";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

export function generateMetadata(): Metadata {
  return {
    title: productLineTeamsNotificationsPageTitle(resolveProductLineIdFromEnv()),
  };
}

export default async function TeamsNotificationsIntegrationPage() {
  const loaded = await loadTeamsNotificationsIntegrationPageData();

  return <TeamsNotificationsIntegrationPageClient loaded={loaded} />;
}
