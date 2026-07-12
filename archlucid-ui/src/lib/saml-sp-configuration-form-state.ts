import type { TenantIdentityProviderConfigurationRecord } from "@/lib/admin-identity-provider-api";
import type { IdentityProviderActivateBody } from "@/lib/admin-identity-provider-api";
import { TENANT_IDENTITY_PROTOCOL } from "@/lib/tenant-identity-protocol";

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

  if (record === null || record.protocol !== TENANT_IDENTITY_PROTOCOL.Saml) {
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
  return resolveSamlSpConfigurationValidationError(values) === null;
}

/** Returns the first validation error for SAML SP configuration, if any. */
export function resolveSamlSpConfigurationValidationError(values: SamlSpConfigurationFormValues): string | null {
  if (values.issuerUri.trim().length === 0) {
    return "Issuer / entity ID is required.";
  }

  if (values.roleClaimName.trim().length === 0) {
    return "Attribute used for roles/groups is required.";
  }

  const populatedMappings = values.mappings.filter((row) => row.idpValue.trim().length > 0);

  if (!populatedMappings.some((row) => row.archLucidRole.trim().length > 0)) {
    return "Add at least one IdP group or role mapping.";
  }

  for (const row of populatedMappings) {
    if (row.archLucidRole.trim().length === 0) {
      return "Complete every role mapping row or clear unused values.";
    }
  }

  const idpValues = populatedMappings.map((row) => row.idpValue.trim().toLowerCase());
  const duplicate = idpValues.find((value, index) => idpValues.indexOf(value) !== index);

  if (duplicate !== undefined) {
    return `Duplicate IdP group or role value: ${duplicate}`;
  }

  return null;
}
