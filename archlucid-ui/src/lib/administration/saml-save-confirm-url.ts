import { IDENTITY_PROVIDERS_SAML_CANONICAL_PATH } from "@/lib/identity-providers-saml-evidence-copy";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!confirmOpen) {
      params.delete(SAML_SAVE_CONFIRM_PARAM);
    } else {
      params.set(SAML_SAVE_CONFIRM_PARAM, "1");
    }
    },
  });
}
