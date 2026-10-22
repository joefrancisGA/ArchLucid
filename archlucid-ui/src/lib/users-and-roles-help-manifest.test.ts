import { describe, expect, it } from "vitest";

import {
  USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS,
  USERS_AND_ROLES_CAPABILITY_ROWS,
  USERS_AND_ROLES_CONTRACT_VERSION,
  USERS_AND_ROLES_FAQ,
  USERS_AND_ROLES_GUIDE_HEADINGS,
  USERS_AND_ROLES_ROLE_OVERVIEW,
} from "@/lib/users-and-roles-help-manifest";
import { BUILTIN_ROLE_ORDER } from "@/app/(operator)/administration/users/_sections/roles-matrix-constants";
import { USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY } from "@/lib/users-and-roles-help-evidence-copy";

describe("users-and-roles-help-manifest", () => {
  it("covers the four built-in assignable workspace roles", () => {
    expect(USERS_AND_ROLES_ROLE_OVERVIEW.map((role) => role.id)).toEqual([...BUILTIN_ROLE_ORDER]);
  });

  it("maps capability rows to every built-in role column", () => {
    for (const row of USERS_AND_ROLES_CAPABILITY_ROWS) {
      expect(Object.keys(row.roles).sort()).toEqual([...BUILTIN_ROLE_ORDER].sort());
    }
  });

  it("keeps as-of copy aligned with the users-and-roles contract version", () => {
    expect(USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY).toContain(USERS_AND_ROLES_CONTRACT_VERSION);
  });

  it("aligns in-page TOC ids with guide section anchors", () => {
    expect(USERS_AND_ROLES_GUIDE_HEADINGS.map((heading) => heading.id)).toEqual([
      "how-access-works",
      "role-overview",
      "capability-matrix",
      "workspace-access",
      "review-participation",
      "managing-access",
      "security-guidance",
      "common-questions",
    ]);
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
