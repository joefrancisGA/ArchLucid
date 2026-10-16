import { describe, expect, it } from "vitest";

import {
  resolveUsersAndRolesHelpClaimDiscipline,
  resolveUsersAndRolesHelpSources,
  SECURENOW_USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  SECURENOW_USERS_AND_ROLES_HELP_SOURCES,
  USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  USERS_AND_ROLES_HELP_SOURCES,
} from "@/lib/users-and-roles-help-evidence-copy";

describe("users-and-roles-help-evidence-copy SecureNow", () => {
  it("resolves SecureNow claim discipline and audit lineage sources", () => {
    expect(resolveUsersAndRolesHelpClaimDiscipline("security")).toBe(SECURENOW_USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE);
    expect(resolveUsersAndRolesHelpClaimDiscipline("security")).toContain("SecureNow");
    expect(resolveUsersAndRolesHelpClaimDiscipline("architecture")).toBe(USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE);

    const sources = resolveUsersAndRolesHelpSources("security");

    expect(sources).toEqual(SECURENOW_USERS_AND_ROLES_HELP_SOURCES);
    expect(sources.some((link) => link.label === "Audit evidence lineage")).toBe(true);
    expect(sources.some((link) => link.href.includes("/administration/billing"))).toBe(false);
    expect(resolveUsersAndRolesHelpSources("architecture")).toEqual(USERS_AND_ROLES_HELP_SOURCES);
  });
});
