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
  { label: "Protocol", description: "OIDC or SAML 2.0" },
  { label: "Discover", description: "Metadata URL" },
  { label: "Map roles", description: "Claim → role" },
  { label: "Test login", description: "Sandbox verify" },
  { label: "Activate", description: "Save tenant row" },
] as const;

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
