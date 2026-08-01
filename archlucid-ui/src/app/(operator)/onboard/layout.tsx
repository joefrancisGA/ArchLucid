import type { Metadata } from "next";

import { LEGACY_ONBOARD_ROUTE_METADATA } from "@/lib/legacy-onboard-route-metadata";

export const metadata: Metadata = LEGACY_ONBOARD_ROUTE_METADATA;

export default function LegacyOnboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
