import type { Metadata } from "next";

import { WhySecureNowDraftView } from "@/app/(marketing)/why-securenow/WhySecureNowDraftView";
import { WHY_SECURENOW_DRAFT_PITCH } from "@/lib/marketing/why-securenow-draft-copy";

export const metadata: Metadata = {
  title: "SecureNow · Why SecureNow",
  description: WHY_SECURENOW_DRAFT_PITCH,
  robots: { index: true, follow: true },
};

export default function WhySecureNowDraftPage(): React.JSX.Element {
  return <WhySecureNowDraftView />;
}
