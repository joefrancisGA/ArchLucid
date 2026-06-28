import type { Metadata } from "next";

import { WebhooksSettingsClient } from "./WebhooksSettingsClient";

export const metadata: Metadata = {
  title: "Webhooks",
};

/** Integration hub for outbound HTTPS webhook subscriptions (URLs, secrets metadata, connectivity tests). */
export default function WebhooksIntegrationPage() {
  return <WebhooksSettingsClient />;
}
