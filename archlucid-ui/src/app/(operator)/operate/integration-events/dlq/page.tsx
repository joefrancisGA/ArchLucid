import type { Metadata } from "next";

import { IntegrationEventsDlqPageClient } from "./_sections/IntegrationEventsDlqPageClient";

export const metadata: Metadata = {
  title: "Integration event dead letters",
};

/** Admin-only dead-letter queue for failed outbound integration events. */
export default function IntegrationEventsDlqPage() {
  return <IntegrationEventsDlqPageClient />;
}
