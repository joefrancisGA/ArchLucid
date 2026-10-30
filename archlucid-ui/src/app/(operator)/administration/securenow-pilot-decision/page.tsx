import type { Metadata } from "next";

import { SecureNowPilotDecisionPageView } from "./SecureNowPilotDecisionPageView";

export const metadata: Metadata = {
  title: "Pilot decision preparation",
};

export default function SecureNowPilotDecisionPage(): React.JSX.Element {
  return <SecureNowPilotDecisionPageView />;
}
