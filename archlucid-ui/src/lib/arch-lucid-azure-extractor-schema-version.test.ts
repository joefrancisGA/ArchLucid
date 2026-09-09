import { describe, expect, it } from "vitest";

import {
  ARCH_LUCID_AZURE_EXTRACTOR_MINIMUM_SUPPORTED_SCHEMA_VERSION,
  ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION,
  formatUnsupportedAzureExtractorSchemaVersionMessage,
  isSupportedAzureExtractorSchemaVersion,
} from "@/lib/arch-lucid-azure-extractor-schema-version";

describe("isSupportedAzureExtractorSchemaVersion", () => {
  it("accepts legacy schemaVersion 1 and current packager schemaVersion 2", () => {
    expect(isSupportedAzureExtractorSchemaVersion(1)).toBe(true);
    expect(isSupportedAzureExtractorSchemaVersion(2)).toBe(true);
    expect(ARCH_LUCID_AZURE_EXTRACTOR_MINIMUM_SUPPORTED_SCHEMA_VERSION).toBe(1);
    expect(ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION).toBe(2);
  });

  it("rejects versions outside the Core 1–2 range", () => {
    expect(isSupportedAzureExtractorSchemaVersion(0)).toBe(false);
    expect(isSupportedAzureExtractorSchemaVersion(3)).toBe(false);
    expect(isSupportedAzureExtractorSchemaVersion(99)).toBe(false);
  });
});

describe("formatUnsupportedAzureExtractorSchemaVersionMessage", () => {
  it("lists the supported range instead of a single required version", () => {
    expect(formatUnsupportedAzureExtractorSchemaVersionMessage(99)).toBe(
      "Unsupported manifest schemaVersion: 99. Supported schema versions: 1–2.",
    );
  });
});
