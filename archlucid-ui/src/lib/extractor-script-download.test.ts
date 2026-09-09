import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARCHLUCID_AZURE_EXTRACTOR_SCRIPT_API_PATH,
  EXTRACTOR_SCRIPT_CDN_URL,
  SECURENOW_AZURE_EXTRACTOR_SCRIPT_API_PATH,
  azureExtractorScriptApiPath,
  extractorScriptCdnUrl,
} from "@/lib/extractor-script-url";
import { tryReadAzureExtractorScript } from "@/lib/load-azure-extractor-script";

describe("extractor script download URL", () => {
  it("defaults to the same-origin API route instead of the unresolved CDN hostname", () => {
    expect(EXTRACTOR_SCRIPT_CDN_URL).toBe(ARCHLUCID_AZURE_EXTRACTOR_SCRIPT_API_PATH);
    expect(EXTRACTOR_SCRIPT_CDN_URL).not.toContain("cdn.archlucid.net");
  });

  it("routes SecureNow to the consumer-branded packager script API path", () => {
    expect(azureExtractorScriptApiPath("security")).toBe(SECURENOW_AZURE_EXTRACTOR_SCRIPT_API_PATH);
    expect(extractorScriptCdnUrl("security")).toBe(SECURENOW_AZURE_EXTRACTOR_SCRIPT_API_PATH);
  });
});

describe("load-azure-extractor-script", () => {
  it("reads the ArchLucid Azure packager script from the monorepo checkout", () => {
    const scriptText = tryReadAzureExtractorScript("architecture");

    expect(scriptText).not.toBeNull();
    expect(scriptText).toMatch(/\$scriptVersion\s*=\s*"/);
  });

  it("reads the SecureNow Azure packager script from the monorepo checkout", () => {
    const scriptText = tryReadAzureExtractorScript("security");

    expect(scriptText).not.toBeNull();
    expect(scriptText).toMatch(/SecureNow Azure extractor/i);
  });
});

describe("ui Dockerfile extractor script packaging", () => {
  const dockerfile = readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");

  it("copies the Azure packager scripts into the runtime image", () => {
    expect(dockerfile).toContain(
      "COPY --chown=archlucid:archlucid scripts/azure/Get-ArchLucidAzurePackage.ps1 /scripts/azure/Get-ArchLucidAzurePackage.ps1",
    );
    expect(dockerfile).toContain(
      "COPY --chown=archlucid:archlucid scripts/azure/Get-SecureNowAzurePackage.ps1 /scripts/azure/Get-SecureNowAzurePackage.ps1",
    );
  });
});
