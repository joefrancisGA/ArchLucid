import { IDENTITY_PROVIDERS_SAML_CANONICAL_PATH } from "@/lib/identity-providers-saml-evidence-copy";

export const SAML_SAVE_CONFIRM_PARAM = "samlSaveConfirm";

export function parseSamlSaveConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function samlSaveConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string = IDENTITY_PROVIDERS_SAML_CANONICAL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(SAML_SAVE_CONFIRM_PARAM);
  } else {
    params.set(SAML_SAVE_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
