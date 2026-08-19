import type { Metadata } from "next";

import { SlackIntegrationPageClient } from "./_sections/SlackIntegrationPageClient";

export const metadata: Metadata = {
  title: "Slack notifications",
};

export default function SlackIntegrationPage(): React.ReactElement {
  return <SlackIntegrationPageClient />;
}
