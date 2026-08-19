import { describe, expect, it } from "vitest";

import { isAzureGuid } from "@/lib/azure-identifier-validation";

describe("isAzureGuid", () => {
  it("accepts canonical lowercase GUIDs", () => {
    expect(isAzureGuid("00000000-0000-0000-0000-000000000001")).toBe(true);
  });

  it("rejects crafted injection strings", () => {
    expect(isAzureGuid("'; rm -rf /")).toBe(false);
    expect(isAzureGuid("00000000-0000-0000-0000-000000000001\nmalicious")).toBe(false);
  });

  it("rejects empty and whitespace-only values", () => {
    expect(isAzureGuid("")).toBe(false);
    expect(isAzureGuid("   ")).toBe(false);
  });
});
