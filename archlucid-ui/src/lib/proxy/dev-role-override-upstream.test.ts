import { describe, expect, it, vi } from "vitest";

import { DEV_EMPLOYEE_API_ACTOR_ROLE, DEV_ROLE_OVERRIDE_COOKIE } from "@/lib/dev-testing-overrides";
import { resolveDevRoleOverrideUpstreamHeader } from "@/lib/proxy/dev-role-override-upstream";

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

  it("maps Employee to PlatformOperator for DevelopmentBypass upstream shaping", () => {
    vi.stubEnv("NODE_ENV", "development");

    const cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=Employee; Path=/`;

    expect(resolveDevRoleOverrideUpstreamHeader(createRequest(cookie) as never)).toBe(
      DEV_EMPLOYEE_API_ACTOR_ROLE,
    );
  });

  it("forwards Admin unchanged", () => {
    vi.stubEnv("NODE_ENV", "development");

    const cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=Admin; Path=/`;

    expect(resolveDevRoleOverrideUpstreamHeader(createRequest(cookie) as never)).toBe("Admin");
  });
});
