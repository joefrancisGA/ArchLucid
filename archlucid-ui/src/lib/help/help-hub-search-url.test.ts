import { describe, expect, it } from "vitest";

import { parseHelpHubSearchQuery } from "@/lib/help/help-hub-search-url";

describe("parseHelpHubSearchQuery", () => {
  it("trims leading and trailing whitespace from inbound q values", () => {
    expect(parseHelpHubSearchQuery(" policy ")).toBe("policy");
    expect(parseHelpHubSearchQuery("  ")).toBe("");
  });
});
