import { describe, expect, it } from "vitest";

import {
  formatCloudConnectionImportSuccessMessage,
  formatTier2ConnectionValidationPackageLine,
} from "./cloud-connection-import-success-message";

describe("formatCloudConnectionImportSuccessMessage", () => {
  it("states when resource count or package id were not stored", () => {
    const message = formatCloudConnectionImportSuccessMessage("Validation", undefined, "");

    expect(message).toContain("Resource count was not stored.");
    expect(message).toContain("Package id was not stored.");
    expect(message).not.toContain("undefined");
  });

  it("keeps stored zero resource count", () => {
    expect(formatCloudConnectionImportSuccessMessage("Collection", 0, "pkg-1")).toContain("0 resources imported");
  });
});

describe("formatTier2ConnectionValidationPackageLine", () => {
  it("states when package id or resource count were not stored", () => {
    const line = formatTier2ConnectionValidationPackageLine("Accepted.", null, null);

    expect(line).toContain("Package id was not stored.");
    expect(line).toContain("Resource count was not stored.");
  });
});
