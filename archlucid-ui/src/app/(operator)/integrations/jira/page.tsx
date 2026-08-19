import type { Metadata } from "next";

import { JiraIntegrationPageClient } from "./_sections/JiraIntegrationPageClient";

export const metadata: Metadata = {
  title: "Jira",
};

export default function JiraIntegrationPage(): React.ReactElement {
  return <JiraIntegrationPageClient />;
}
