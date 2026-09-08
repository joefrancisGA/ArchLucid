import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/extractor-scripts/azure/Get-SecureNowAzurePackage.ps1", () => {
  it("returns the SecureNow Azure packager script as a downloadable attachment", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("Get-SecureNowAzurePackage.ps1");

    const body = await response.text();

    expect(body).toMatch(/SecureNow Azure extractor/i);
  });
});
