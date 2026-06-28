import type { Metadata } from "next";

import { ItsmProductIntegrationPageClient } from "../_sections/itsm/ItsmProductIntegrationPageClient";

export const metadata: Metadata = {
  title: "ServiceNow",
};

export default function ServiceNowIntegrationPage(): React.ReactElement {
  return <ItsmProductIntegrationPageClient product="servicenow" />;
}
