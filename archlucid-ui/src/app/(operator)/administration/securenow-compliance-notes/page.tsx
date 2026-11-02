import type { Metadata } from "next";

import { SecureNowComplianceNotesPageView } from "./SecureNowComplianceNotesPageView";

export const metadata: Metadata = {
  title: "Compliance notes",
};

export default function SecureNowComplianceNotesPage(): React.JSX.Element {
  return <SecureNowComplianceNotesPageView />;
}
