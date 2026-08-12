/**
 * TB-2270 — Developer ≠ API contracts ≠ API keys vocabulary triad.
 *
 * Three related administration / help surfaces:
 * - Internal developer tools (`/administration/developer`) are operator-only
 *   evaluation and CLI demo utilities — not customer credential management.
 * - API contracts (`/help/api-contracts`) is the Admin technical HTTP contract
 *   reference (OpenAPI / API_CONTRACTS.md) — not key rotation.
 * - Host automation credentials (`/help/cli-usage`) are configured via deployment
 *   settings — not the retired API keys settings page.
 *
 * They stay separate because evaluating developer tools is not reading HTTP
 * contracts, and contracts are not credentials. Operators need all three with
 * deep links so they do not conflate tools, docs, and keys.
 */

import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";
import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { DEVELOPER_SETTINGS_CANONICAL_PATH } from "@/lib/developer-settings-evidence-copy";

export type DeveloperApiContractsApiKeysSurfaceId =
  | "developer"
  | "api-contracts"
  | "api-keys";

export type DeveloperApiContractsApiKeysLink = {
  readonly id: DeveloperApiContractsApiKeysSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DeveloperApiContractsApiKeysVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly developerLink: DeveloperApiContractsApiKeysLink;
  readonly apiContractsLink: DeveloperApiContractsApiKeysLink;
  readonly apiKeysLink: DeveloperApiContractsApiKeysLink;
};

export const DEVELOPER_API_CONTRACTS_API_KEYS_HEADING =
  "Developer tools, API contracts, and API keys are three different jobs" as const;

export const DEVELOPER_API_CONTRACTS_API_KEYS_WHY_THREE =
  "Internal developer tools are operator evaluation and CLI demo utilities. API contracts is the Admin HTTP technical reference (OpenAPI). API keys rotate automation credentials for enterprise integrations. Tools are not contracts, and contracts are not credentials — open the peer when you need that job." as const;

export const DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE =
  "Developer tools evaluate; API contracts document HTTP; CLI usage help covers host automation — open the other when you need that job." as const;

export const DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK: DeveloperApiContractsApiKeysLink = {
  id: "developer",
  label: "Internal developer tools",
  href: DEVELOPER_SETTINGS_CANONICAL_PATH,
  whenToUse: "Evaluate branded themes and try CLI demo utilities (operator-only).",
};

export const DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK: DeveloperApiContractsApiKeysLink =
  {
    id: "api-contracts",
    label: "API contracts",
    href: API_CONTRACTS_HELP_PATH,
    whenToUse: "Read the Admin HTTP technical reference and OpenAPI contract facts.",
  };

export const DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK: DeveloperApiContractsApiKeysLink = {
  id: "api-keys",
  label: "CLI usage help",
  href: API_KEYS_SETTINGS_CANONICAL_PATH,
  whenToUse: "Configure host automation credentials and CLI access for enterprise integrations.",
};

const ALL_LINKS: readonly DeveloperApiContractsApiKeysLink[] = [
  DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK,
  DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK,
];

/** Full triad vocabulary model (heading, why-three, and deep links). */
export function buildDeveloperApiContractsApiKeysVocabulary(): DeveloperApiContractsApiKeysVocabularyModel {
  return {
    heading: DEVELOPER_API_CONTRACTS_API_KEYS_HEADING,
    whyThree: DEVELOPER_API_CONTRACTS_API_KEYS_WHY_THREE,
    compactLine: DEVELOPER_API_CONTRACTS_API_KEYS_COMPACT_LINE,
    developerLink: DEVELOPER_API_CONTRACTS_API_KEYS_DEVELOPER_LINK,
    apiContractsLink: DEVELOPER_API_CONTRACTS_API_KEYS_API_CONTRACTS_LINK,
    apiKeysLink: DEVELOPER_API_CONTRACTS_API_KEYS_API_KEYS_LINK,
  };
}

/** Resolve the link for the current surface (null when unknown). */
export function resolveDeveloperApiContractsApiKeysLink(
  surfaceId: DeveloperApiContractsApiKeysSurfaceId,
): DeveloperApiContractsApiKeysLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer deep-links for the surfaces you are not currently on. */
export function resolveDeveloperApiContractsApiKeysPeerLinks(
  currentSurfaceId: DeveloperApiContractsApiKeysSurfaceId,
): readonly DeveloperApiContractsApiKeysLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}
