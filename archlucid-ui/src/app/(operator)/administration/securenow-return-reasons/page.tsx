import type { Metadata } from "next";

import { SecureNowReturnReasonsPageView } from "./SecureNowReturnReasonsPageView";

export const metadata: Metadata = {
  title: "When to come back",
};

export default function SecureNowReturnReasonsPage(): React.JSX.Element {
  return <SecureNowReturnReasonsPageView />;
}
