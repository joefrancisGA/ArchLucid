import { describe, expect, it } from "vitest";

import {
  AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE,
  isAzureExtractorZipFile,
} from "@/lib/is-azure-extractor-zip-file";

describe("isAzureExtractorZipFile", () => {
  it("accepts .zip extension", () => {
    expect(isAzureExtractorZipFile(new File([], "package.zip"))).toBe(true);
  });

  it("accepts application/zip mime type", () => {
    expect(isAzureExtractorZipFile(new File([], "package", { type: "application/zip" }))).toBe(true);
  });

  it("rejects non-zip files", () => {
    expect(isAzureExtractorZipFile(new File([], "notes.txt", { type: "text/plain" }))).toBe(false);
  });

  it("exports a stable rejection message", () => {
    expect(AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE).toMatch(/\.zip/i);
  });
});
