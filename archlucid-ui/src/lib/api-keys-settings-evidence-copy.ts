import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const API_KEYS_SETTINGS_CANONICAL_PATH = "/administration/api-keys" as const;

export const API_KEYS_SETTINGS_CLAIM_DISCIPLINE =
  "This API keys page manages automation credentials for approved enterprise configurations - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Users and roles help, Audit, or Assurance status when you need membership, governed trails, or trust cites.";

export const API_KEYS_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when key rotation turns into membership setup, audit trails, CLI usage, or assurance cites.";

export type ApiKeysSettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/administration/api-keys`. */
export const API_KEYS_SETTINGS_SOURCES: readonly ApiKeysSettingsSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "Users and roles", href: "/administration/users" },
  { label: "CLI usage help", href: inAppHelpHref("cli-usage") },
  { label: "Audit", href: "/governance/audit" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
