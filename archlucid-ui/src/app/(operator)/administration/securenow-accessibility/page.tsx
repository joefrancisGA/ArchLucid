import type { Metadata } from "next";

import { SecureNowAccessibilityPageView } from "./SecureNowAccessibilityPageView";

export const metadata: Metadata = {
  title: "Accessibility",
};

export default function SecureNowAccessibilityPage(): React.JSX.Element {
  return <SecureNowAccessibilityPageView />;
}
