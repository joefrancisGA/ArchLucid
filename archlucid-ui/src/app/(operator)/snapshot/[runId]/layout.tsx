import type { Metadata } from "next";

import { LEGACY_SNAPSHOT_ROUTE_METADATA } from "@/lib/legacy-snapshot-route-metadata";

export const metadata: Metadata = LEGACY_SNAPSHOT_ROUTE_METADATA;

export default function LegacySnapshotLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
