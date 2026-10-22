import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CLI_USAGE_HELP_PAGE_TITLE = "CLI usage (technical reference)";

export const CLI_USAGE_HELP_PAGE_SUBTITLE =
  "Engineering runbook for non-interactive `archlucid` commands, environment variables, and exit codes. Not customer self-serve diligence.";

export const CLI_USAGE_HELP_ACTION_PANEL_TITLE = "Symptom-first support";

export const CLI_USAGE_HELP_PRIMARY_ACTIONS = {
  openTroubleshooting: {
    label: "Customer Troubleshooting",
    href: inAppHelpHref("troubleshooting"),
  },
} as const;

export const CLI_USAGE_HELP_CANONICAL_PATH = CLI_USAGE_HELP_PATH;
