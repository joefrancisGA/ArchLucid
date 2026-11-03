import type { Metadata } from "next";

import { SecureNowSkuCardView } from "./SecureNowSkuCardView";

export const metadata: Metadata = {
  title: "SecureNow SKU and meter card",
  robots: { index: true, follow: true },
};

export default function SecureNowSkuPage(): React.JSX.Element {
  return <SecureNowSkuCardView />;
}
