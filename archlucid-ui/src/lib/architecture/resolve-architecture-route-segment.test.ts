import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";
import { CUSTOMER_INTAKE_SAMPLE_DEFINITION } from "@/lib/samples/customer-intake-modernization/definition";

const { getArchitectureIdentity, getDraftRequest } = vi.hoisted(() => ({
  getArchitectureIdentity: vi.fn(),
  getDraftRequest: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/api/architecture-identity-api", () => ({
  getArchitectureIdentity,
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest,
}));

vi.mock("@/lib/server-operator-scope", () => ({
  getServerResolvedScopeHeaders: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("resolveArchitectureRouteSegment", () => {
  it("prefers a persisted architecture identity over a colliding sample package slug", async () => {
    getArchitectureIdentity.mockResolvedValue({ architectureId: CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug });

    const resolved = await resolveArchitectureRouteSegment(CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug);

    expect(resolved).toEqual({
      kind: "identity",
      architectureId: CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug,
    });
    expect(getDraftRequest).not.toHaveBeenCalled();
  });

  it("falls back to a registered sample package slug after an identity 404", async () => {
    getArchitectureIdentity.mockRejectedValue(
      new ApiRequestError("Not Found: The requested resource was not found.", {
        problem: {
          title: "Not Found",
          detail: "The requested resource was not found.",
          status: 404,
        },
        correlationId: null,
        httpStatus: 404,
      }),
    );

    const resolved = await resolveArchitectureRouteSegment(CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug);

    expect(resolved).toEqual({
      kind: "identity",
      architectureId: CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug,
    });
    expect(getDraftRequest).not.toHaveBeenCalled();
  });

  it("falls back to a legacy draft when identity probing returns a 404", async () => {
    getArchitectureIdentity.mockRejectedValue(
      new ApiRequestError("Not Found: The requested resource was not found.", {
        problem: {
          title: "Not Found",
          detail: "The requested resource was not found.",
          status: 404,
        },
        correlationId: null,
        httpStatus: 404,
      }),
    );
    getDraftRequest.mockResolvedValue({
      draftId: "architecture-identity-001",
      architectureId: null,
    });

    await expect(resolveArchitectureRouteSegment("architecture-identity-001")).resolves.toEqual({
      kind: "legacy-draft",
      draftId: "architecture-identity-001",
    });
    expect(getDraftRequest).toHaveBeenCalledWith("architecture-identity-001", {
      scopeHeaders: {},
    });
  });
});
