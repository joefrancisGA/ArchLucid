"use client";

import { CloudConnectionsPageShell } from "./CloudConnectionsPageShell";
import { useCloudConnectionsPage } from "./use-cloud-connections-page";

export function CloudConnectionsPageClient() {
  const state = useCloudConnectionsPage();

  return <CloudConnectionsPageShell {...state} />;
}
