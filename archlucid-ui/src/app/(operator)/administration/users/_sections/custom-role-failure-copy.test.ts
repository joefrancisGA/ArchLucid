import { describe, expect, it } from "vitest";

import { customRoleFailureCopy, type CustomRoleFailureKind } from "./custom-role-failure-copy";
import { CustomRoleRequestError, customRoleRequestStatus } from "./custom-role-request-error";

const ALL_KINDS: readonly CustomRoleFailureKind[] = ["load", "save", "create"];

describe("custom-role-failure-copy", () => {
  it("never leaks an HTTP status code into buyer-facing copy", () => {
    const statuses: readonly (number | null)[] = [null, 400, 403, 404, 409, 500, 503];

    for (const kind of ALL_KINDS) {
      for (const status of statuses) {
        const copy = customRoleFailureCopy(kind, status);

        expect(copy.title).not.toMatch(/\d{3}/);
        expect(copy.description).not.toMatch(/\d{3}/);
        expect(copy.title.length).toBeGreaterThan(0);
        expect(copy.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("explains a duplicate role name on create", () => {
    const copy = customRoleFailureCopy("create", 409);

    expect(copy.title).toMatch(/already exists/i);
    expect(copy.description).toMatch(/different role name/i);
  });

  it("explains a missing role on save", () => {
    expect(customRoleFailureCopy("save", 404).title).toMatch(/no longer exists/i);
  });

  it("explains insufficient authority for every action", () => {
    for (const kind of ALL_KINDS)
      expect(customRoleFailureCopy(kind, 403).description).toMatch(/administrator/i);
  });

  it("falls back to a service-unavailable message for server and network failures", () => {
    expect(customRoleFailureCopy("load", 500).title).toMatch(/could not load roles/i);
    expect(customRoleFailureCopy("create", null).title).toMatch(/could not create the role/i);
    expect(customRoleFailureCopy("save", 503).title).toMatch(/could not save the role/i);
  });
});

describe("custom-role-request-error", () => {
  it("carries the HTTP status of a failed request", () => {
    expect(customRoleRequestStatus(new CustomRoleRequestError(409))).toBe(409);
    expect(customRoleRequestStatus(new CustomRoleRequestError(null))).toBeNull();
  });

  it("reports no status for unexpected error shapes", () => {
    expect(customRoleRequestStatus(new Error("boom"))).toBeNull();
    expect(customRoleRequestStatus("boom")).toBeNull();
    expect(customRoleRequestStatus(null)).toBeNull();
  });
});
