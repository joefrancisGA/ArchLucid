import { describe, expect, it } from "vitest";

import {
  USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS,
  USERS_AND_ROLES_CAPABILITY_ROWS,
  USERS_AND_ROLES_FAQ,
  USERS_AND_ROLES_ROLE_OVERVIEW,
} from "@/lib/users-and-roles-help-manifest";
import { BUILTIN_ROLE_ORDER } from "@/app/(operator)/settings/users/_sections/roles-matrix-constants";

describe("users-and-roles-help-manifest", () => {
  it("covers the four built-in assignable workspace roles", () => {
    expect(USERS_AND_ROLES_ROLE_OVERVIEW.map((role) => role.id)).toEqual([...BUILTIN_ROLE_ORDER]);
  });

  it("maps capability rows to every built-in role column", () => {
    for (const row of USERS_AND_ROLES_CAPABILITY_ROWS) {
      expect(Object.keys(row.roles).sort()).toEqual([...BUILTIN_ROLE_ORDER].sort());
    }
  });

  it("keeps customer copy free of engineering terminology", () => {
    const haystack = [
      ...USERS_AND_ROLES_ROLE_OVERVIEW.flatMap((role) => [role.label, role.summary, role.restrictions, role.intendedUser]),
      ...USERS_AND_ROLES_CAPABILITY_ROWS.map((row) => row.label),
      ...USERS_AND_ROLES_FAQ.flatMap((item) => [item.question, item.answer]),
    ].join("\n");

    for (const pattern of USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS) {
      expect(haystack).not.toMatch(pattern);
    }
  });
});
