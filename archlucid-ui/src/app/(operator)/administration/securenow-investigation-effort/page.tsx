import type { Metadata } from "next";

import { SecureNowInvestigationEffortPageView } from "./SecureNowInvestigationEffortPageView";

export const metadata: Metadata = {
  title: "Investigation effort",
};

export default function SecureNowInvestigationEffortPage(): React.JSX.Element {
  return <SecureNowInvestigationEffortPageView />;
}
