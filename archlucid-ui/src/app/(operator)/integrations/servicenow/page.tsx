import type { Metadata } from "next";

import { ServiceNowIntegrationPageClient } from "./_sections/ServiceNowIntegrationPageClient";

export const metadata: Metadata = {
  title: "ServiceNow",
};

export default function ServiceNowIntegrationPage(): React.ReactElement {
  return <ServiceNowIntegrationPageClient />;
}
