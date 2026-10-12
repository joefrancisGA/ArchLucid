import type { Metadata } from "next";

import { CollectionAgentPageClient } from "@/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient";

export const metadata: Metadata = {
  title: "Collection agent",
};

export default function CollectionAgentPage(): React.JSX.Element {
  return <CollectionAgentPageClient />;
}
