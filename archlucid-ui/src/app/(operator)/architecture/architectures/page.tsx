import type { Metadata } from "next";

import { ArchitecturesHubPageShell } from "./_sections/ArchitecturesHubPageShell";
import { ARCHITECTURES_HUB_PAGE_TITLE } from "@/lib/architectures-hub-copy";

export const metadata: Metadata = {
  title: ARCHITECTURES_HUB_PAGE_TITLE,
};

export default function ArchitecturesListPage(): React.JSX.Element {
  return <ArchitecturesHubPageShell />;
}
