import type { Metadata } from "next";

import { SecureNowFirstHourPageView } from "./SecureNowFirstHourPageView";

export const metadata: Metadata = {
  title: "First hour preparation",
};

export default function SecureNowFirstHourPage(): React.JSX.Element {
  return <SecureNowFirstHourPageView />;
}
