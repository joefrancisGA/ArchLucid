import type { Metadata } from "next";

import { LEGACY_QUICK_START_ROUTE_METADATA } from "@/lib/legacy-quick-start-route-metadata";

export const metadata: Metadata = LEGACY_QUICK_START_ROUTE_METADATA;

export default function LegacyQuickStartLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
