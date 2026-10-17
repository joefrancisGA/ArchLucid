import type { Metadata } from "next";

import { CollectionAgentPageClient } from "@/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient";
import { SECURENOW_COLLECTION_AGENT_PATH } from "@/lib/product-line/securenow-collection-agent-route";
import { resolveSecureNowPageHeading } from "@/lib/product-line/securenow-page-heading";

export const metadata: Metadata = {
  title: resolveSecureNowPageHeading("security", "Collection Agent", SECURENOW_COLLECTION_AGENT_PATH),
};

export default function CollectionAgentPage(): React.JSX.Element {
  return <CollectionAgentPageClient />;
}
