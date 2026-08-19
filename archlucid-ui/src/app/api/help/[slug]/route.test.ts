import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchPrincipalMock = vi.fn();
const getServerCurrentPrincipalMock = vi.fn();
const readNextPublicAuthModeMock = vi.fn();

vi.mock("@/lib/server-current-principal", () => ({
  fetchPrincipalWithHeadersForHelpRoute: (...args: unknown[]) => fetchPrincipalMock(...args),
  getServerCurrentPrincipal: (...args: unknown[]) => getServerCurrentPrincipalMock(...args),
}));

vi.mock("@/lib/legacy-arch-env", () => ({
  readNextPublicAuthMode: (...args: unknown[]) => readNextPublicAuthModeMock(...args),
}));

vi.mock("@/lib/server-operator-scope", () => ({
  getServerResolvedScopeHeaders: vi.fn(async () => ({})),
}));

import { GET } from "@/app/api/help/[slug]/route";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

describe("GET /api/help/[slug] (TB-735 / TB-1329)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    fetchPrincipalMock.mockReset();
    getServerCurrentPrincipalMock.mockReset();
    readNextPublicAuthModeMock.mockReset();
    readNextPublicAuthModeMock.mockReturnValue("jwt-bearer");
  });

  it("returns product-help markdown without authorization", async () => {
    const response = await GET(new NextRequest("http://localhost/api/help/getting-started"), {
      params: Promise.resolve({ slug: "getting-started" }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { slug: string; markdown: string };

    expect(body.slug).toBe("getting-started");
    expect(body.markdown.length).toBeGreaterThan(0);
  });

  it("returns 404 for internal-runbook topics without authorization in jwt-bearer mode", async () => {
    const response = await GET(new NextRequest("http://localhost/api/help/configuration-reference"), {
      params: Promise.resolve({ slug: "configuration-reference" }),
    });

    expect(response.status).toBe(404);
    expect(fetchPrincipalMock).not.toHaveBeenCalled();
    expect(getServerCurrentPrincipalMock).not.toHaveBeenCalled();
  });

  it("returns internal-runbook markdown for admins in development-bypass without inbound authorization", async () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");
    readNextPublicAuthModeMock.mockReturnValue("development-bypass");
    getServerCurrentPrincipalMock.mockResolvedValue({
      authorityRank: AUTHORITY_RANK.AdminAuthority,
      hasRecognizedArchLucidRole: true,
    });

    const response = await GET(new NextRequest("http://localhost/api/help/configuration-reference"), {
      params: Promise.resolve({ slug: "configuration-reference" }),
    });

    expect(response.status).toBe(200);
    expect(getServerCurrentPrincipalMock).toHaveBeenCalled();
    expect(fetchPrincipalMock).not.toHaveBeenCalled();

    const body = (await response.json()) as { slug: string; markdown: string };

    expect(body.slug).toBe("configuration-reference");
    expect(body.markdown.length).toBeGreaterThan(0);
  });

  it("returns 404 for internal-runbook topics when development-bypass principal is not admin", async () => {
    readNextPublicAuthModeMock.mockReturnValue("development-bypass");
    getServerCurrentPrincipalMock.mockResolvedValue({
      authorityRank: AUTHORITY_RANK.ExecuteAuthority,
      hasRecognizedArchLucidRole: true,
    });

    const response = await GET(new NextRequest("http://localhost/api/help/configuration-reference"), {
      params: Promise.resolve({ slug: "configuration-reference" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns internal-runbook markdown for admin callers with inbound authorization", async () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");
    fetchPrincipalMock.mockResolvedValue({
      authorityRank: AUTHORITY_RANK.AdminAuthority,
      hasRecognizedArchLucidRole: true,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/help/configuration-reference", {
        headers: { Authorization: "Bearer test-token" },
      }),
      {
        params: Promise.resolve({ slug: "configuration-reference" }),
      },
    );

    expect(response.status).toBe(200);
    expect(fetchPrincipalMock).toHaveBeenCalled();
  });
});
