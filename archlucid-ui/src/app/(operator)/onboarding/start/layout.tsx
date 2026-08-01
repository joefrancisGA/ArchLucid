import type { Metadata } from "next";

import { LEGACY_ONBOARDING_START_ROUTE_METADATA } from "@/lib/legacy-onboarding-start-route-metadata";

export const metadata: Metadata = LEGACY_ONBOARDING_START_ROUTE_METADATA;

export default function LegacyOnboardingStartLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return children;
}
