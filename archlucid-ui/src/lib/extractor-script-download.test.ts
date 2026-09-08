import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  AZURE_EXTRACTOR_SCRIPT_API_PATH,
  EXTRACTOR_SCRIPT_CDN_URL,
} from "@/lib/extractor-script-url";
import { tryReadAzureExtractorScript } from "@/lib/load-azure-extractor-script";

describe("extractor script download URL", () => {
  it("defaults to the same-origin API route instead of the unresolved CDN hostname", () => {
    expect(EXTRACTOR_SCRIPT_CDN_URL).toBe(AZURE_EXTRACTOR_SCRIPT_API_PATH);
    expect(EXTRACTOR_SCRIPT_CDN_URL).not.toContain("cdn.archlucid.net");
  });
});

describe("load-azure-extractor-script", () => {
  it("reads the Azure packager script from the monorepo checkout", () => {
    const scriptText = tryReadAzureExtractorScript();

    expect(scriptText).not.toBeNull();
    expect(scriptText).toMatch(/\$scriptVersion\s*=\s*"/);
  });
});

describe("ui Dockerfile extractor script packaging", () => {
  const dockerfile = readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");

  it("copies the Azure packager script into the runtime image", () => {
    expect(dockerfile).toContain(
      "COPY --chown=archlucid:archlucid scripts/azure/Get-ArchLucidAzurePackage.ps1 /scripts/azure/Get-ArchLucidAzurePackage.ps1",
    );
  });
});
