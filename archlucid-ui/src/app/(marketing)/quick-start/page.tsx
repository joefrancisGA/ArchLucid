import type { Metadata } from "next";
import type { ReactElement } from "react";

import { QuickStartClient } from "./QuickStartClient";

export const metadata: Metadata = {
  title: "Quick start · ArchLucid",
  description:
    "Run a deterministic simulator pass with no sign-in: create a demo-scoped architecture run, commit a manifest, and open the operator run.",
  robots: { index: true, follow: true },
};

export default function QuickStartMarketingPage(): ReactElement {
  return (
    <main>
      <QuickStartClient />
    </main>
  );
}
