import type { Metadata } from "next";

import { WelcomeMarketingPage } from "@/components/marketing/WelcomeMarketingPage";

export const metadata: Metadata = {
  title: "Welcome",
  description: "ArchLucid AI Architecture Intelligence — trial signup and product overview.",
};

export default function WelcomePage() {
  return (
    <main>
      <WelcomeMarketingPage />
    </main>
  );
}
