import { describe, expect, it, vi } from "vitest";

import {
  DEV_ROLE_OVERRIDE_COOKIE,
  DEV_TEST_ACTOR_ROLE_HEADER,
  DEV_EMPLOYEE_API_ACTOR_ROLE,
} from "@/lib/dev-testing-overrides";
import {
  applyDevRoleOverrideUpstreamHeader,
  resolveDevRoleOverrideUpstreamHeader,
} from "@/lib/proxy/dev-role-override-upstream";

function createRequest(cookie: string | null): { headers: { get: (name: string) => string | null } } {
  return {
    headers: {
      get(name: string) {
        if (name === "cookie") {
          return cookie;
        }

        return null;
      },
    },
  };
}

describe("dev-role-override-upstream", () => {
  it("does not forward a header when no cookie is present", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(resolveDevRoleOverrideUpstreamHeader(createRequest(null) as never)).toBeNull();
  });

  it("forwards PlatformOperator when Employee override cookie is set", () => {
    vi.stubEnv("NODE_ENV", "development");

    const cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=Employee; Path=/`;

    expect(resolveDevRoleOverrideUpstreamHeader(createRequest(cookie) as never)).toBe(
      DEV_EMPLOYEE_API_ACTOR_ROLE,
    );
  });

  it("applies the header to upstream headers", () => {
    vi.stubEnv("NODE_ENV", "development");

    const cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=Employee; Path=/`;
    const headers = new Headers();

    applyDevRoleOverrideUpstreamHeader(headers, createRequest(cookie) as never);

    expect(headers.get(DEV_TEST_ACTOR_ROLE_HEADER)).toBe(DEV_EMPLOYEE_API_ACTOR_ROLE);
  });
});
