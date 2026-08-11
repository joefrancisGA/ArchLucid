import { permanentRedirect } from "next/navigation";

import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";

/**
 * Retired duplicate of the CLI runbook. The canonical surface is the `cli-usage` help topic,
 * which enforces the internal-runbook authority gate on the server before rendering.
 */
export default function CliUsageInternalPage(): never {
  permanentRedirect(CLI_USAGE_HELP_PATH);
}
