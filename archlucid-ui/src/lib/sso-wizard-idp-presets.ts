/**
 * SSO wizard identity-provider presets (TB-2232).
 * Buyer-facing path chooser before protocol selection; suggestedProtocol defaults the next step when known.
 */

export type SsoWizardIdpPresetId = "entra" | "okta" | "auth0" | "other";

export type SsoWizardIdpSuggestedProtocol = "oidc" | "saml" | null;

export type SsoWizardIdpPreset = {
  readonly id: SsoWizardIdpPresetId;
  readonly label: string;
  readonly description: string;
  readonly suggestedProtocol: SsoWizardIdpSuggestedProtocol;
};

export const SSO_WIZARD_IDP_PRESETS: readonly SsoWizardIdpPreset[] = [
  {
    id: "entra",
    label: "Microsoft Entra ID",
    description: "Workforce single sign-on with Microsoft Entra ID (Azure AD).",
    suggestedProtocol: "oidc",
  },
  {
    id: "okta",
    label: "Okta",
    description: "Workforce single sign-on with Okta.",
    suggestedProtocol: "oidc",
  },
  {
    id: "auth0",
    label: "Auth0",
    description: "Workforce single sign-on with Auth0.",
    suggestedProtocol: "oidc",
  },
  {
    id: "other",
    label: "Other",
    description: "Another directory or SSO product. You will choose the protocol next.",
    suggestedProtocol: null,
  },
] as const;

export function getSsoWizardIdpPreset(id: SsoWizardIdpPresetId): SsoWizardIdpPreset | undefined {
  return SSO_WIZARD_IDP_PRESETS.find((preset) => preset.id === id);
}

export function resolveSuggestedProtocolForIdp(
  id: SsoWizardIdpPresetId,
): SsoWizardIdpSuggestedProtocol {
  const preset = getSsoWizardIdpPreset(id);

  return preset?.suggestedProtocol ?? null;
}

export function isSsoWizardIdpPresetId(value: string): value is SsoWizardIdpPresetId {
  return SSO_WIZARD_IDP_PRESETS.some((preset) => preset.id === value);
}
