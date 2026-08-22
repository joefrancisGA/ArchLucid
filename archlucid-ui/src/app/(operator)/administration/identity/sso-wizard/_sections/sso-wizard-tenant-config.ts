import type { TenantIdentityProviderConfigurationRecord } from "@/lib/admin-identity-provider-api";
import { TENANT_IDENTITY_PROTOCOL } from "@/lib/tenant-identity-protocol";

import type { SsoWizardProtocol, SsoWizardState } from "./sso-wizard-state";
import { createDefaultSsoWizardState } from "./sso-wizard-state";

type ClaimMappingJsonDocument = {
  roleClaimName?: string;
  mappings?: { idpValue?: string; archLucidRole?: string }[];
  customGroupClaimRegex?: string | null;
};

export type SsoWizardExistingConfigSummary = {
  readonly protocolLabel: string;
  readonly issuerUri: string;
  readonly isActive: boolean;
  readonly updatedUtc: string | null;
  readonly mappedRoleCount: number;
};

function resolveProtocolLabel(protocol: SsoWizardProtocol | null): string {
  if (protocol === "oidc") {
    return "OpenID Connect";
  }

  if (protocol === "saml") {
    return "SAML 2.0";
  }

  return " — ";
}

function parseClaimMappingJson(claimMappingJson: string | undefined): ClaimMappingJsonDocument | null {
  if (typeof claimMappingJson !== "string" || claimMappingJson.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(claimMappingJson) as ClaimMappingJsonDocument;
  } catch {
    return null;
  }
}

export function resolveSsoWizardProtocolFromTenantRecord(
  record: TenantIdentityProviderConfigurationRecord,
): SsoWizardProtocol | null {
  if (record.protocol === TENANT_IDENTITY_PROTOCOL.Saml) {
    return "saml";
  }

  if (record.protocol === TENANT_IDENTITY_PROTOCOL.Oidc) {
    return "oidc";
  }

  return null;
}

export function buildSsoWizardExistingConfigSummary(
  record: TenantIdentityProviderConfigurationRecord,
): SsoWizardExistingConfigSummary {
  const protocol = resolveSsoWizardProtocolFromTenantRecord(record);
  const parsedMapping = parseClaimMappingJson(record.claimMappingJson);
  const mappedRoleCount =
    parsedMapping?.mappings?.filter(
      (entry) => (entry.idpValue?.trim().length ?? 0) > 0 && (entry.archLucidRole?.trim().length ?? 0) > 0,
    ).length ?? 0;

  return {
    protocolLabel: resolveProtocolLabel(protocol),
    issuerUri: record.issuerUri?.trim() ?? " — ",
    isActive: Boolean(record.isActive),
    updatedUtc: record.updatedUtc ?? null,
    mappedRoleCount,
  };
}

/** Pre-fill wizard fields from the tenant identity provider record when one exists. */
export function hydrateSsoWizardStateFromTenantRecord(
  record: TenantIdentityProviderConfigurationRecord,
): SsoWizardState {
  const defaults = createDefaultSsoWizardState();
  const protocol = resolveSsoWizardProtocolFromTenantRecord(record);
  const parsedMapping = parseClaimMappingJson(record.claimMappingJson);

  const savedMappings = (parsedMapping?.mappings ?? [])
    .map((entry) => {
      const archLucidRole = entry.archLucidRole?.trim() ?? "";
      const idpValue = entry.idpValue?.trim() ?? "";

      if (archLucidRole.length === 0 || idpValue.length === 0) {
        return null;
      }

      return { idpValue, archLucidRole };
    })
    .filter((row): row is { idpValue: string; archLucidRole: string } => row !== null);

  const hydratedMappings =
    savedMappings.length > 0
      ? savedMappings.map((row) => ({
          idpValue: row.idpValue,
          archLucidRole: row.archLucidRole,
        }))
      : defaults.claimMapping.mappings;

  return {
    ...defaults,
    protocol,
    issuerUri: record.issuerUri?.trim() ?? "",
    claimMapping: {
      roleClaimName: parsedMapping?.roleClaimName?.trim() || defaults.claimMapping.roleClaimName,
      mappings: hydratedMappings,
      customGroupClaimRegex: parsedMapping?.customGroupClaimRegex?.trim() ?? "",
    },
    keyVaultSecretName: record.keyVaultSecretName?.trim() ?? "",
  };
}
