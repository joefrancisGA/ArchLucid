import type { Metadata } from "next";

import { SecureNowReviewerPacketPageView } from "./SecureNowReviewerPacketPageView";

export const metadata: Metadata = {
  title: "Reviewer packet",
};

export default function SecureNowReviewerPacketPage(): React.JSX.Element {
  return <SecureNowReviewerPacketPageView />;
}
