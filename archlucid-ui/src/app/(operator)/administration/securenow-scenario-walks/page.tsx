import type { Metadata } from "next";

import { SecureNowScenarioWalksPageView } from "./SecureNowScenarioWalksPageView";

export const metadata: Metadata = {
  title: "Fixture walks",
};

export default function SecureNowScenarioWalksPage(): React.JSX.Element {
  return <SecureNowScenarioWalksPageView />;
}
