import type { Metadata } from "next";

import { SecureNowSelfServicePageView } from "./SecureNowSelfServicePageView";

export const metadata: Metadata = {
  title: "When you are stuck",
};

export default function SecureNowSelfServicePage(): React.JSX.Element {
  return <SecureNowSelfServicePageView />;
}
