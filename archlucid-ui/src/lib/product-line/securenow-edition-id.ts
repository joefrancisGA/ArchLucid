export const SECURENOW_EDITION_IDS = ["generic", "uhg"] as const;

export type SecureNowEditionId = (typeof SECURENOW_EDITION_IDS)[number];

export const DEFAULT_SECURENOW_EDITION_ID: SecureNowEditionId = "generic";

export function isSecureNowEditionId(value: string | null | undefined): value is SecureNowEditionId {
  return value !== null && value !== undefined && SECURENOW_EDITION_IDS.some((id) => id === value);
}
