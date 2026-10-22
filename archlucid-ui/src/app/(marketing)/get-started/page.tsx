import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GetStartedPageClient } from "@/app/(marketing)/get-started/GetStartedPageClient";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Get started · ArchLucid",
  description:
    "Explore an illustrative architecture review without signing in, or start a guided sample review in your workspace in about 30 minutes.",
  robots: { index: true, follow: true },
};

export default function GetStartedPage(): ReactNode {
  return (
    <MarketingPageShell className={cn(MARKETING_LAYOUT.mainOnboarding)} data-testid="get-started-shell">
      <GetStartedPageClient />
    </MarketingPageShell>
  );
}
