import type { Metadata } from "next";

import { SecureNowReadoutPackPageView } from "./SecureNowReadoutPackPageView";

export const metadata: Metadata = {
  title: "Readout pack",
};

export default function SecureNowReadoutPackPage(): React.JSX.Element {
  return <SecureNowReadoutPackPageView />;
}
