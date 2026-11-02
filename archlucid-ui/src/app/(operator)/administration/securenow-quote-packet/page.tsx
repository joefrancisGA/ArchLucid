import type { Metadata } from "next";

import { SecureNowQuotePacketPageView } from "./SecureNowQuotePacketPageView";

export const metadata: Metadata = {
  title: "Quote packet",
};

export default function SecureNowQuotePacketPage(): React.JSX.Element {
  return <SecureNowQuotePacketPageView />;
}
