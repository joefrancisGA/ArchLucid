import type { Metadata } from "next";

import { ItsmProductIntegrationPageClient } from "../_sections/itsm/ItsmProductIntegrationPageClient";

export const metadata: Metadata = {
  title: "Jira",
};

export default function JiraIntegrationPage(): React.ReactElement {
  return <ItsmProductIntegrationPageClient product="jira" />;
}
