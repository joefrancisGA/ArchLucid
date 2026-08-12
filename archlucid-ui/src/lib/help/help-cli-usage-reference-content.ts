/** Buyer-safe landing metadata for `/help/cli-usage` (TB-948). */
export const CLI_USAGE_HELP_REFERENCE_LANDING = {
  audience: "Integration developers, platform engineers, and API consumers automating ArchLucid workflows.",
  documentSource: "CLI usage documentation",
  purpose:
    "Non-interactive `archlucid` commands, configuration keys, environment variables, exit codes, and REST starter fixtures.",
  stability: "Generally available — ships with the ArchLucid CLI and documented API contracts.",
} as const;

/** Customer-facing terminology guard — variants must not appear on `/help/cli-usage`. */
export const CLI_USAGE_HELP_PROHIBITED_AUDIENCE_TERMS = [
  "day one developer",
  "day-one developer",
  "day 1 developer",
  "first-day developer",
  "developer onboarding on day one",
] as const;
