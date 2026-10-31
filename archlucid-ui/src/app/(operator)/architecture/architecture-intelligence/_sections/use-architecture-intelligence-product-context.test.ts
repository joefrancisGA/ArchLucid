import { describe, expect, it } from "vitest";

import { hasUsableArchitectureSourceText } from "./use-architecture-intelligence-product-context";

describe("hasUsableArchitectureSourceText", () => {
  it("rejects source rows whose contents are only whitespace", () => {
    expect(
      hasUsableArchitectureSourceText([
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: " \n\t ",
        },
      ]),
    ).toBe(false);
  });

  it("accepts a source row with non-empty content", () => {
    expect(
      hasUsableArchitectureSourceText([
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "Describe the system.",
        },
      ]),
    ).toBe(true);
  });
});
