import { describe, expect, it } from "vitest";

import { parsePersistedClaimMappingJson } from "./persisted-claim-mapping-json";

describe("parsePersistedClaimMappingJson", () => {
  it("reads camelCase documents written for the wizard", () => {
    const parsed = parsePersistedClaimMappingJson(
      JSON.stringify({
        roleClaimName: "department",
        customGroupClaimRegex: "^group-(Admin)$",
        mappings: [{ idpValue: "finance-admins", archLucidRole: "Admin" }],
      }),
    );

    expect(parsed).toEqual({
      roleClaimName: "department",
      customGroupClaimRegex: "^group-(Admin)$",
      mappings: [{ idpValue: "finance-admins", archLucidRole: "Admin" }],
    });
  });

  it("reads PascalCase documents already stored by activation", () => {
    const parsed = parsePersistedClaimMappingJson(
      JSON.stringify({
        RoleClaimName: "department",
        CustomGroupClaimRegex: "^group-(Admin)$",
        Mappings: [{ IdpValue: "finance-admins", ArchLucidRole: "Admin" }],
      }),
    );

    expect(parsed).toEqual({
      roleClaimName: "department",
      customGroupClaimRegex: "^group-(Admin)$",
      mappings: [{ idpValue: "finance-admins", archLucidRole: "Admin" }],
    });
  });

  it("returns null for blank or non-object JSON", () => {
    expect(parsePersistedClaimMappingJson("  ")).toBeNull();
    expect(parsePersistedClaimMappingJson("[]")).toBeNull();
    expect(parsePersistedClaimMappingJson("{")).toBeNull();
  });
});
