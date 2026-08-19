import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchPrincipalMock = vi.fn();
const readCustomerHelpTopicPdfMock = vi.fn();
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

vi.mock("@/lib/read-customer-help-topic-pdf", () => ({
  readCustomerHelpTopicPdf: (...args: unknown[]) => readCustomerHelpTopicPdfMock(...args),
}));

import { GET } from "@/app/api/help/[slug]/pdf/route";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

describe("GET /api/help/[slug]/pdf (TB-726)", () => {
  beforeEach(() => {
    fetchPrincipalMock.mockReset();
    readCustomerHelpTopicPdfMock.mockReset();
    getServerCurrentPrincipalMock.mockReset();
    readNextPublicAuthModeMock.mockReset();
    readNextPublicAuthModeMock.mockReturnValue("jwt-bearer");
    readCustomerHelpTopicPdfMock.mockResolvedValue({ bytes: Buffer.from("%PDF"), size: 4 });
  });

  it("redirects public PDF slugs to the static docs-pdf path", async () => {
    const response = await GET(new NextRequest("http://localhost/api/help/getting-started/pdf"), {
      params: Promise.resolve({ slug: "getting-started" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/docs-pdf/getting-started.pdf");
  });

  it("returns 401 for customer PDFs without authorization in jwt-bearer mode", async () => {
    const response = await GET(new NextRequest("http://localhost/api/help/cloud-connections-azure/pdf"), {
      params: Promise.resolve({ slug: "cloud-connections-azure" }),
    });

    expect(response.status).toBe(401);
  });

  it("streams customer PDFs in development-bypass without inbound authorization", async () => {
    readNextPublicAuthModeMock.mockReturnValue("development-bypass");
    getServerCurrentPrincipalMock.mockResolvedValue({
      authorityRank: AUTHORITY_RANK.ReadAuthority,
      hasRecognizedArchLucidRole: true,
    });

    const response = await GET(new NextRequest("http://localhost/api/help/cloud-connections-azure/pdf"), {
      params: Promise.resolve({ slug: "cloud-connections-azure" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(getServerCurrentPrincipalMock).toHaveBeenCalled();
    expect(fetchPrincipalMock).not.toHaveBeenCalled();
  });

  it("returns 403 for customer PDFs when the principal is not recognized", async () => {
    fetchPrincipalMock.mockResolvedValue({
      authorityRank: AUTHORITY_RANK.ReadAuthority,
      hasRecognizedArchLucidRole: false,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/help/cloud-connections-azure/pdf", {
        headers: { Authorization: "Bearer test-token" },
      }),
      {
        params: Promise.resolve({ slug: "cloud-connections-azure" }),
      },
    );

    expect(response.status).toBe(403);
  });

  it("streams customer PDFs for recognized authenticated operators", async () => {
    fetchPrincipalMock.mockResolvedValue({
      authorityRank: AUTHORITY_RANK.ReadAuthority,
      hasRecognizedArchLucidRole: true,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/help/cloud-connections-azure/pdf", {
        headers: { Authorization: "Bearer test-token" },
      }),
      {
        params: Promise.resolve({ slug: "cloud-connections-azure" }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("cloud-connections-azure.pdf");
    expect(readCustomerHelpTopicPdfMock).toHaveBeenCalledWith("cloud-connections-azure");
  });
});
