/**
 * TB-2097 — graph loading fallback must not title the surface Evidence trail (WA-23).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const GRAPH_STATIC_FALLBACK = join(process.cwd(), "src/components/GraphStaticFallback.tsx");

describe("TB-2097 graph static fallback guard (WA-23)", () => {
  it("labels the graph surface Evidence graph, not Evidence trail", () => {
    const source = readFileSync(GRAPH_STATIC_FALLBACK, "utf8");

    expect(source).toContain("Evidence graph");
    expect(source).not.toMatch(/aria-label="Evidence trail/);
  });
});
