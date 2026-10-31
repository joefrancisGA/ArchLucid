import type { Metadata } from "next";

import { SecureNowSampleView } from "@/app/(marketing)/securenow-sample/SecureNowSampleView";
import { WHY_SECURENOW_DRAFT_PITCH } from "@/lib/marketing/securenow-sample-copy";

export const metadata: Metadata = {
  title: "SecureNow · Sample",
  description: WHY_SECURENOW_DRAFT_PITCH,
  robots: { index: true, follow: true },
};

export default function SecureNowSamplePage(): React.JSX.Element {
  return <SecureNowSampleView />;
}
