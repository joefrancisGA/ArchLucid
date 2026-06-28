import type { Metadata } from "next";

import { ItsmIntegrationPageClient } from "./_sections/ItsmIntegrationPageClient";

export const metadata: Metadata = {
  title: "Jira & ServiceNow",
};

export default function ItsmIntegrationPage(): React.ReactElement {
  return <ItsmIntegrationPageClient />;
}
