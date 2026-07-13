export type SsoWizardProtocol = "oidc" | "saml";

export type SsoWizardClaimMappingEntry = {
  idpValue: string;
  archLucidRole: string;
};

export type SsoWizardClaimMapping = {
  roleClaimName: string;
  mappings: SsoWizardClaimMappingEntry[];
  customGroupClaimRegex?: string;
};

export type SsoWizardState = {
  protocol: SsoWizardProtocol | null;
  metadataUrl: string;
  issuerUri: string;
  jwksUri: string | null;
  signingCertificateThumbprints: string[];
  availableClaimNames: string[];
  claimMapping: SsoWizardClaimMapping;
  sampleClaimValues: string;
  testLoginSuccess: boolean;
  testLoginSummary: string | null;
  mappedRoles: string[];
  keyVaultSecretName: string;
};

export const ARCHLUCID_ROLES = ["Admin", "Operator", "Reader", "Auditor"] as const;

export const SSO_WIZARD_STEPS = [
  { label: "Protocol", description: "Choose OIDC or SAML" },
  { label: "Provider details", description: "Enter provider metadata" },
  { label: "Role mapping", description: "Map groups and claims" },
  { label: "Test connection", description: "Verify sign-in" },
  { label: "Activate", description: "Review and enable" },
] as const;

export function ssoWizardHasUnsavedChanges(state: SsoWizardState, step: number): boolean {
  if (step > 0) {
    return true;
  }

  if (state.protocol !== null) {
    return true;
  }

  if (state.metadataUrl.trim().length > 0) {
    return true;
  }

  if (state.issuerUri.trim().length > 0) {
    return true;
  }

  if (state.sampleClaimValues.trim().length > 0) {
    return true;
  }

  if (state.keyVaultSecretName.trim().length > 0) {
    return true;
  }

  if (state.claimMapping.mappings.some((mapping) => mapping.idpValue.trim().length > 0)) {
    return true;
  }

  return false;
}

export function createDefaultSsoWizardState(): SsoWizardState {
  return {
    protocol: null,
    metadataUrl: "",
    issuerUri: "",
    jwksUri: null,
    signingCertificateThumbprints: [],
    availableClaimNames: [],
    claimMapping: {
      roleClaimName: "groups",
      mappings: [
        { idpValue: "", archLucidRole: "Admin" },
        { idpValue: "", archLucidRole: "Operator" },
        { idpValue: "", archLucidRole: "Reader" },
        { idpValue: "", archLucidRole: "Auditor" },
      ],
    },
    sampleClaimValues: "",
    testLoginSuccess: false,
    testLoginSummary: null,
    mappedRoles: [],
    keyVaultSecretName: "",
  };
}
