import type { Metadata } from "next";

import { WhySecureNowDraftView } from "@/app/(marketing)/why-securenow/WhySecureNowDraftView";

export const metadata: Metadata = {
  title: "SecureNow · Why SecureNow",
  robots: { index: false, follow: false },
};

export default function WhySecureNowDraftPage(): React.JSX.Element {
  return <WhySecureNowDraftView />;
}
