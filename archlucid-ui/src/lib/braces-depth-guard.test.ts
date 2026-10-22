import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

type BracesApi = {
  (pattern: string, options?: { expand?: boolean }): string[];
  expand: (pattern: string) => string[];
};

const braces = require("braces") as BracesApi;

// Keep aligned with MAX_BRACE_DEPTH in vendor/braces/lib/constants.js.
const maxBraceDepth = 64;

describe("braces depth guard", () => {
  it("expands a single-level alternation", () => {
    expect(braces("src/{a,b}.ts", { expand: true })).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("rejects brace patterns nested past the stack-exhaustion cap", () => {
    const pattern = `${"{".repeat(maxBraceDepth + 1)}a${"}".repeat(maxBraceDepth + 1)}`;

    expect(() => braces.expand(pattern)).toThrow(RangeError);
  });
});
