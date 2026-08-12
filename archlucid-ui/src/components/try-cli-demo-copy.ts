import { readPublicBrowserApiBaseDefault } from "@/lib/legacy-arch-env";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Copy for optional local CLI demo disclosure on internal developer tools (TB-1898). */
export const TRY_CLI_DEMO_DISCLOSURE_SUMMARY = "Local CLI setup command";

/** Placeholder shown in docs — prefer {@link buildTryCliDemoCommand} at runtime. */
export const TRY_CLI_DEMO_COMMAND = "archlucid try --api-base-url <API_BASE_URL>";

export const TRY_CLI_DEMO_REQUIREMENTS =
  "Requires the ArchLucid CLI, .NET SDK, and a running API. Scope headers are read from archlucid.json when present.";

export const TRY_CLI_DEMO_CLI_HELP_LABEL = "CLI usage help";

export const TRY_CLI_DEMO_CLI_HELP_HREF = inAppHelpHref("cli-usage");

/** Interpolates the configured public API base URL for copy-paste CLI runs. */
export function buildTryCliDemoCommand(apiBaseUrl?: string): string {
  const resolved = (apiBaseUrl ?? readPublicBrowserApiBaseDefault()).trim().replace(/\/$/, "");

  return `archlucid try --api-base-url ${resolved}`;
}
