import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/extractor-scripts/azure/Get-ArchLucidAzurePackage.ps1/route";

describe("GET /api/extractor-scripts/azure/Get-ArchLucidAzurePackage.ps1", () => {
  it("returns the Azure packager script as a downloadable text file", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(response.headers.get("Content-Disposition")).toContain("Get-ArchLucidAzurePackage.ps1");

    const body = await response.text();

    expect(body).toMatch(/\$scriptVersion\s*=\s*"/);
    expect(body).toContain("Get-AzResource");
  });
});
