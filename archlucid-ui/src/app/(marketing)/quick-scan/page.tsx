import type { Metadata } from "next";
import type { ReactElement } from "react";

import { QuickScanClient } from "./QuickScanClient";

export const metadata: Metadata = {
  title: "Quick scan · ArchLucid",
  description:
    "Describe a system and receive a concise architecture risk and improvement summary. No account required.",
  robots: { index: true, follow: true },
};

export default function QuickScanMarketingPage(): ReactElement {
  return (
    <main>
      <QuickScanClient />
    </main>
  );
}
