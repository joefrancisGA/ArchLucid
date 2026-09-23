import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/api/architecture-identity-api", () => ({
  getArchitectureIdentity: vi.fn(),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
}));

vi.mock("@/lib/server-operator-scope", () => ({
  getServerResolvedScopeHeaders: vi.fn(async () => ({})),
}));

import { CUSTOMER_INTAKE_SAMPLE_DEFINITION } from "@/lib/samples/customer-intake-modernization/definition";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { getArchitectureIdentity } from "@/lib/api/architecture-identity-api";

describe("resolveArchitectureRouteSegment", () => {
  it("resolves registered sample package slugs without calling the identity API", async () => {
    const resolved = await resolveArchitectureRouteSegment(CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug);

    expect(resolved).toEqual({
      kind: "identity",
      architectureId: CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug,
    });
    expect(getArchitectureIdentity).not.toHaveBeenCalled();
  });
});
