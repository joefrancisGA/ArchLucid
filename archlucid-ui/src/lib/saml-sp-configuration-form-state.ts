import type { TenantIdentityProviderConfigurationRecord } from "@/lib/admin-identity-provider-api";
import type { IdentityProviderActivateBody } from "@/lib/admin-identity-provider-api";

const ARCHLUCID_ROLES = ["Admin", "Operator", "Reader", "Auditor"] as const;

export type SamlSpClaimMappingRow = {
  idpValue: string;
  archLucidRole: string;
};

export type SamlSpConfigurationFormValues = {
  idpMetadataUrl: string;
  issuerUri: string;
  roleClaimName: string;
  mappings: SamlSpClaimMappingRow[];
  customGroupClaimRegex: string;
};

type ClaimMappingJsonDocument = {
  roleClaimName?: string;
  mappings?: { idpValue?: string; archLucidRole?: string }[];
  customGroupClaimRegex?: string | null;
};

export function createDefaultSamlSpConfigurationFormValues(): SamlSpConfigurationFormValues {
  return {
    idpMetadataUrl: "",
    issuerUri: "",
    roleClaimName: "groups",
    mappings: ARCHLUCID_ROLES.map((archLucidRole) => ({ idpValue: "", archLucidRole })),
    customGroupClaimRegex: "",
  };
}

export function hydrateSamlSpConfigurationFormValues(
  record: TenantIdentityProviderConfigurationRecord | null,
): SamlSpConfigurationFormValues {
  const defaults = createDefaultSamlSpConfigurationFormValues();

  if (record === null || record.protocol !== "saml") {
    return defaults;
  }

  let parsedMapping: ClaimMappingJsonDocument | null = null;

  if (typeof record.claimMappingJson === "string" && record.claimMappingJson.trim().length > 0) {
    try {
      parsedMapping = JSON.parse(record.claimMappingJson) as ClaimMappingJsonDocument;
    } catch {
      parsedMapping = null;
    }
  }

  const mappingByRole = new Map<string, string>();

  for (const entry of parsedMapping?.mappings ?? []) {
    const role = entry.archLucidRole?.trim() ?? "";
    const idpValue = entry.idpValue?.trim() ?? "";

    if (role.length > 0) {
      mappingByRole.set(role, idpValue);
    }
  }

  return {
    ...defaults,
    issuerUri: record.issuerUri?.trim() ?? "",
    roleClaimName: parsedMapping?.roleClaimName?.trim() || defaults.roleClaimName,
    customGroupClaimRegex: parsedMapping?.customGroupClaimRegex?.trim() ?? "",
    mappings: ARCHLUCID_ROLES.map((archLucidRole) => ({
      archLucidRole,
      idpValue: mappingByRole.get(archLucidRole) ?? "",
    })),
  };
}

export function buildSamlSpActivateRequest(values: SamlSpConfigurationFormValues): IdentityProviderActivateBody {
  return {
    protocol: "saml",
    issuerUri: values.issuerUri.trim(),
    metadataXml: null,
    claimMapping: {
      roleClaimName: values.roleClaimName.trim(),
      mappings: values.mappings.filter((row) => row.idpValue.trim().length > 0),
      customGroupClaimRegex: values.customGroupClaimRegex.trim() || null,
    },
    keyVaultSecretName: null,
  };
}

export { ARCHLUCID_ROLES as SAML_SP_ARCHLUCID_ROLES };

export function isSamlSpConfigurationFormValid(values: SamlSpConfigurationFormValues): boolean {
  if (values.issuerUri.trim().length === 0) {
    return false;
  }

  if (values.roleClaimName.trim().length === 0) {
    return false;
  }

  return values.mappings.some((row) => row.idpValue.trim().length > 0 && row.archLucidRole.trim().length > 0);
}
