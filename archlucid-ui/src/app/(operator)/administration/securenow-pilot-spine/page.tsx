import type { Metadata } from "next";

import { SecureNowPilotSpinePageView } from "./SecureNowPilotSpinePageView";

export const metadata: Metadata = {
  title: "Pilot walkthrough (fixture)",
};

export default function SecureNowPilotSpinePage(): React.JSX.Element {
  return <SecureNowPilotSpinePageView />;
}
