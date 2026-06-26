import { describe, expect, it } from "vitest";

import {
  buildSamlSpActivateRequest,
  createDefaultSamlSpConfigurationFormValues,
  hydrateSamlSpConfigurationFormValues,
  isSamlSpConfigurationFormValid,
} from "./saml-sp-configuration-form-state";

describe("saml-sp-configuration-form-state", () => {
  it("builds activate request with trimmed SAML fields", () => {
    const values = createDefaultSamlSpConfigurationFormValues();
    values.issuerUri = " https://idp.example.com/ ";
    values.roleClaimName = " memberOf ";
    values.mappings[0] = { archLucidRole: "Admin", idpValue: " al-admins " };

    const request = buildSamlSpActivateRequest(values);

    expect(request.protocol).toBe("saml");
    expect(request.issuerUri).toBe("https://idp.example.com/");
    expect(request.claimMapping.roleClaimName).toBe("memberOf");
    expect(request.claimMapping.mappings).toEqual([{ idpValue: " al-admins ", archLucidRole: "Admin" }]);
  });

  it("hydrates claim mappings from tenant SAML configuration record", () => {
    const values = hydrateSamlSpConfigurationFormValues({
      protocol: "Saml",
      issuerUri: "https://sts.contoso.com/",
      claimMappingJson: JSON.stringify({
        roleClaimName: "groups",
        mappings: [{ idpValue: "AL-Admin", archLucidRole: "Admin" }],
      }),
    });

    expect(values.issuerUri).toBe("https://sts.contoso.com/");
    expect(values.roleClaimName).toBe("groups");
    expect(values.mappings.find((row) => row.archLucidRole === "Admin")?.idpValue).toBe("AL-Admin");
  });

  it("requires issuer, role claim, and at least one mapping", () => {
    const invalid = createDefaultSamlSpConfigurationFormValues();

    expect(isSamlSpConfigurationFormValid(invalid)).toBe(false);

    invalid.issuerUri = "https://idp.example.com/";
    invalid.mappings[0] = { archLucidRole: "Admin", idpValue: "admins" };

    expect(isSamlSpConfigurationFormValid(invalid)).toBe(true);
  });
});
