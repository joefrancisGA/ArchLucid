import { describe, expect, it } from "vitest";

import { TENANT_IDENTITY_PROTOCOL } from "@/lib/tenant-identity-protocol";

import { hydrateSsoWizardStateFromTenantRecord } from "./sso-wizard-tenant-config";

describe("hydrateSsoWizardStateFromTenantRecord", () => {
  it("hydrates PascalCase claim mapping stored before camelCase activation", () => {
    const state = hydrateSsoWizardStateFromTenantRecord({
      protocol: TENANT_IDENTITY_PROTOCOL.Oidc,
      issuerUri: "https://idp.example/",
      claimMappingJson: JSON.stringify({
        RoleClaimName: "department",
        CustomGroupClaimRegex: "^group-(Admin)$",
        Mappings: [{ IdpValue: "finance-admins", ArchLucidRole: "Admin" }],
      }),
    });

    expect(state.protocol).toBe("oidc");
    expect(state.issuerUri).toBe("https://idp.example/");
    expect(state.claimMapping.roleClaimName).toBe("department");
    expect(state.claimMapping.customGroupClaimRegex).toBe("^group-(Admin)$");
    expect(state.claimMapping.mappings).toEqual([{ idpValue: "finance-admins", archLucidRole: "Admin" }]);
  });
});
