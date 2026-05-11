import type { Metadata } from "next";
import type { ReactElement } from "react";

import { QuickScanClient } from "./QuickScanClient";

export const metadata: Metadata = {
  title: "Quick scan · ArchLucid",
  description:
    "Run a minimal architecture quick scan with no sign-in — ephemeral system context and findings for exploration.",
  robots: { index: true, follow: true },
};

export default function QuickScanMarketingPage(): ReactElement {
  return (
    <main>
      <QuickScanClient />
    </main>
  );
}
