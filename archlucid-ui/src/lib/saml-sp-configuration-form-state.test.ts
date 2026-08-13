import { describe, expect, it } from "vitest";

import {
  addSamlSpClaimMappingRow,
  buildSamlSpActivateRequest,
  createDefaultSamlSpConfigurationFormValues,
  hydrateSamlSpConfigurationFormValues,
  isSamlSpConfigurationFormValid,
  resolveSamlSpConfigurationValidationErrors,
} from "./saml-sp-configuration-form-state";
import { IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED } from "@/lib/identity-providers-settings-copy";
import { TENANT_IDENTITY_PROTOCOL } from "@/lib/tenant-identity-protocol";

describe("saml-sp-configuration-form-state", () => {
  it("builds activate request with trimmed SAML fields", () => {
    const values = createDefaultSamlSpConfigurationFormValues();
    values.issuerUri = " https://idp.example.com/ ";
    values.roleClaimName = " memberOf ";
    values.mappings[0] = { ...values.mappings[0], archLucidRole: "Admin", idpValue: " al-admins " };

    const request = buildSamlSpActivateRequest(values);

    expect(request.protocol).toBe("saml");
    expect(request.issuerUri).toBe("https://idp.example.com/");
    expect(request.claimMapping.roleClaimName).toBe("memberOf");
    expect(request.claimMapping.mappings).toEqual([{ idpValue: "al-admins", archLucidRole: "Admin" }]);
  });

  it("hydrates all claim mappings including multiple groups per role", () => {
    const values = hydrateSamlSpConfigurationFormValues({
      protocol: TENANT_IDENTITY_PROTOCOL.Saml,
      issuerUri: "https://sts.contoso.com/",
      claimMappingJson: JSON.stringify({
        roleClaimName: "groups",
        mappings: [
          { idpValue: "AL-Admin-A", archLucidRole: "Admin" },
          { idpValue: "AL-Admin-B", archLucidRole: "Admin" },
        ],
      }),
    });

    expect(values.issuerUri).toBe("https://sts.contoso.com/");
    expect(values.roleClaimName).toBe("groups");
    expect(values.mappings).toHaveLength(2);
    expect(values.mappings.every((row) => row.archLucidRole === "Admin")).toBe(true);
    expect(values.mappings.map((row) => row.idpValue)).toEqual(["AL-Admin-A", "AL-Admin-B"]);
    expect(new Set(values.mappings.map((row) => row.rowId)).size).toBe(2);
  });

  it("requires issuer, role claim, and at least one mapping", () => {
    const invalid = createDefaultSamlSpConfigurationFormValues();

    expect(isSamlSpConfigurationFormValid(invalid)).toBe(false);

    invalid.issuerUri = "https://idp.example.com/";
    invalid.mappings[0] = { ...invalid.mappings[0], archLucidRole: "Admin", idpValue: "admins" };

    expect(isSamlSpConfigurationFormValid(invalid)).toBe(true);
  });

  it("uses IdP-specific issuer validation copy", () => {
    const invalid = createDefaultSamlSpConfigurationFormValues();

    expect(isSamlSpConfigurationFormValid(invalid)).toBe(false);
    expect(IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED).toContain("IdP entity ID");
  });

  it("allows repeated ArchLucid roles while rejecting duplicate IdP values", () => {
    const values = createDefaultSamlSpConfigurationFormValues();
    values.issuerUri = "https://idp.example.com/";
    values.mappings = [
      { rowId: "row-1", idpValue: "group-a", archLucidRole: "Admin" },
      { rowId: "row-2", idpValue: "group-b", archLucidRole: "Admin" },
    ];

    expect(isSamlSpConfigurationFormValid(values)).toBe(true);

    values.mappings[1] = { rowId: "row-2", idpValue: "group-a", archLucidRole: "Admin" };

    expect(isSamlSpConfigurationFormValid(values)).toBe(false);
  });

  it("adds mapping rows with stable generated ids", () => {
    const values = createDefaultSamlSpConfigurationFormValues();
    const next = addSamlSpClaimMappingRow(values);

    expect(next.mappings).toHaveLength(values.mappings.length + 1);
    expect(next.mappings[next.mappings.length - 1]?.rowId.length).toBeGreaterThan(0);
  });

  it("returns every validation error instead of stopping at the first failure", () => {
    const invalid = createDefaultSamlSpConfigurationFormValues();

    expect(resolveSamlSpConfigurationValidationErrors(invalid)).toEqual([
      IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED,
      "Add at least one IdP group or role mapping.",
    ]);
  });
});
