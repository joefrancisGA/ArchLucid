import { describe, expect, it, vi } from "vitest";

import { listSecurityDeclaredConnections } from "@/lib/security-declared-connection-api";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
  proxyJsonPost: vi.fn(),
}));

import { proxyJsonGet } from "@/lib/proxy-json-client";

describe("security-declared-connection-api", () => {
  it("does not invent status, relationship, or provenance when the API omits them", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValue([
      {
        connectionId: "conn-1",
        fromCloudResourceId: "from",
        toCloudResourceId: "to",
        rationale: "because",
      },
    ]);

    const rows = await listSecurityDeclaredConnections();

    expect(rows[0]?.status).toBeUndefined();
    expect(rows[0]?.relationshipType).toBeUndefined();
    expect(rows[0]?.provenanceKind).toBeUndefined();
  });
});
