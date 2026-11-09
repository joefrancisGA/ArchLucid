import type { Metadata } from "next";

import { SecureNowAcceleratorIndexPageView } from "./SecureNowAcceleratorIndexPageView";

export const metadata: Metadata = {
  title: "Accelerator index",
};

export default function SecureNowAcceleratorIndexPage(): React.JSX.Element {
  return <SecureNowAcceleratorIndexPageView />;
}
