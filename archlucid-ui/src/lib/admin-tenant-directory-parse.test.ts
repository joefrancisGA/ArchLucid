import { describe, expect, it } from "vitest";

import {
  archLucidAppRoleFromDirectoryFields,
  parseAdminApiKeysDirectoryPayload,
  parseAdminUsersDirectoryPayload,
} from "@/lib/admin-tenant-directory-parse";

describe("admin-tenant-directory-parse", () => {
  it("parses users and items arrays", () => {
    const fromUsers = parseAdminUsersDirectoryPayload({
      users: [{ userId: "a", displayName: "A", email: "a@x.test", role: "Operator" }],
    });
    const fromItems = parseAdminUsersDirectoryPayload({
      items: [{ id: "b", name: "B", email: "b@x.test", authorityRank: 3 }],
    });

    expect(fromUsers).toHaveLength(1);
    expect(fromUsers[0]?.authorityLabel).toBe("Operator");
    expect(fromItems).toHaveLength(1);
    expect(fromItems[0]?.authorityLabel).toBe("Rank 3");
    expect(fromItems[0]?.authorityRank).toBe(3);
  });

  it("parses api key payload shapes", () => {
    const rows = parseAdminApiKeysDirectoryPayload({
      apiKeys: [
        { credentialId: "k1", label: "CI key", maskedKey: "ak_***", maxAuthority: "AdminAuthority" },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.credentialId).toBe("k1");
    expect(rows[0]?.displayName).toBe("CI key");
  });

  it("maps ArchLucid policy names and ranks to app roles", () => {
    expect(archLucidAppRoleFromDirectoryFields("ExecuteAuthority")).toBe("Operator");
    expect(archLucidAppRoleFromDirectoryFields("—", 3)).toBe("Admin");
    expect(archLucidAppRoleFromDirectoryFields("Rank 2")).toBe("Operator");
    expect(archLucidAppRoleFromDirectoryFields("Auditor")).toBe("Auditor");
  });
});
