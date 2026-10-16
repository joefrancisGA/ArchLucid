import type { Metadata } from "next";

import { CollectionAgentPageClient } from "@/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient";
import { SECURENOW_COLLECTION_AGENT_PATH } from "@/lib/product-line/securenow-collection-agent-route";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";

export const metadata: Metadata = {
  title: SECURENOW_NAV_LABELS[SECURENOW_COLLECTION_AGENT_PATH] ?? "Collection Agent",
};

export default function CollectionAgentPage(): React.JSX.Element {
  return <CollectionAgentPageClient />;
}
