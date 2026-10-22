/** SecureNow editions are separate deployments of the same app, selected by process config. */
export const SECURENOW_EDITION_IDS = ["generic", "uhg"] as const;

export type SecureNowEditionId = (typeof SECURENOW_EDITION_IDS)[number];

export const DEFAULT_SECURENOW_EDITION_ID: SecureNowEditionId = "generic";

export function isSecureNowEditionId(value: string | null | undefined): value is SecureNowEditionId {
  if (value === null || value === undefined) {
    return false;
  }

  return SECURENOW_EDITION_IDS.some((id) => id === value);
}

/** UHG stays on the SecureNow shell. A product-line cookie must not open Architecture there. */
export function secureNowEditionLocksProductLine(edition: SecureNowEditionId): boolean {
  switch (edition) {
    case "generic":
      return false;
    case "uhg":
      return true;
    default: {
      const unexpected: never = edition;

      return unexpected;
    }
  }
}
