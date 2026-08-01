import type { Metadata } from "next";

import { AzureBoardsIntegrationPageClient } from "./_sections/AzureBoardsIntegrationPageClient";

export const metadata: Metadata = {
  title: "Azure Boards · ArchLucid",
};

export default function AzureBoardsIntegrationPage(): React.ReactElement {
  return <AzureBoardsIntegrationPageClient />;
}
