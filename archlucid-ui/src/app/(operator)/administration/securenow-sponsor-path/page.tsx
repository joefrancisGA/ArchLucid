import type { Metadata } from "next";

import { SecureNowSponsorPathPageView } from "./SecureNowSponsorPathPageView";

export const metadata: Metadata = {
  title: "Sponsor path",
};

export default function SecureNowSponsorPathPage(): React.JSX.Element {
  return <SecureNowSponsorPathPageView />;
}
