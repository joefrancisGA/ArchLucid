import { describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";

import { DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA } from "@/lib/developer-troubleshooting-help-route-metadata";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { resolveInternalRunbookHelpRouteMetadata } from "@/lib/resolve-internal-runbook-help-route-metadata";
import { getInboundAuthenticatedServerPrincipal } from "@/lib/server-current-principal";

const developerEntry: ProductDocumentationEntry = {
  slug: "engineering-troubleshooting",
  title: "Engineering troubleshooting runbook",
  summary: "Admin-only engineering triage.",
  audience: "developer",
  sourcePaths: ["docs/runbooks/TROUBLESHOOTING.md"],
  contentKind: "internal-runbook",
  pdfStatus: null,
};

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/server-current-principal", () => ({
  getInboundAuthenticatedServerPrincipal: vi.fn(),
}));

describe("resolveInternalRunbookHelpRouteMetadata", () => {
  it("returns a neutral non-leaking title when authorization is absent", async () => {
    vi.mocked(headers).mockResolvedValue({
      get: () => null,
    } as Awaited<ReturnType<typeof headers>>);

    await expect(resolveInternalRunbookHelpRouteMetadata(developerEntry)).resolves.toEqual({
      title: "ArchLucid",
      robots: { index: false, follow: false },
    });
  });

  it("returns the real runbook metadata for authorized Admin callers", async () => {
    vi.mocked(headers).mockResolvedValue({
      get: () => "Bearer test-token",
    } as Awaited<ReturnType<typeof headers>>);
    vi.mocked(getInboundAuthenticatedServerPrincipal).mockResolvedValue({
      authorityRank: 3,
    } as Awaited<ReturnType<typeof getInboundAuthenticatedServerPrincipal>>);

    await expect(resolveInternalRunbookHelpRouteMetadata(developerEntry)).resolves.toEqual(
      DEVELOPER_TROUBLESHOOTING_HELP_ROUTE_METADATA,
    );
  });
});
