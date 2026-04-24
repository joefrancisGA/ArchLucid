import type { Metadata } from "next";

// Public marketing home is `/welcome` (not `app/(marketing)/page.tsx`) because `app/(operator)/page.tsx` already owns `/`.
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
