import type { Metadata } from "next";

import { LEGACY_LOGIN_ROUTE_METADATA } from "@/lib/legacy-login-route-metadata";

export const metadata: Metadata = LEGACY_LOGIN_ROUTE_METADATA;

export default function LegacyLoginLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
