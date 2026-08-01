import type { Metadata } from "next";

import { ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA } from "@/lib/administration-connection-status-route-metadata";

export const metadata: Metadata = ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA;

export default function AdministrationConnectionStatusLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
