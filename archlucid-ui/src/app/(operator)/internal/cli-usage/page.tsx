import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CLI_USAGE_HELP_ROUTE_METADATA } from "@/lib/cli-usage-help-route-metadata";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

import { CliUsageInternalPageClient } from "./_sections/CliUsageInternalPageClient";

export const metadata: Metadata = CLI_USAGE_HELP_ROUTE_METADATA;

export default function CliUsageInternalPage(): React.JSX.Element {
  const loaded = tryLoadProductDocumentation("cli-usage");

  if (loaded === null) {
    notFound();
  }

  return <CliUsageInternalPageClient entry={loaded.entry} markdown={loaded.markdown} />;
}
