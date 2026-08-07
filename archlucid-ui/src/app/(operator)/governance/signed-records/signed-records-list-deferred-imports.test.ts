import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routeDir = dirname(fileURLToPath(import.meta.url));

const pageSource = readFileSync(join(routeDir, "page.tsx"), "utf8");

describe("signed-records list deferred imports (TB-2061)", () => {
  it("keeps SignedRecordsListClient off the page static import graph", () => {
    expect(pageSource).not.toContain('import SignedRecordsListClient from "./_sections/SignedRecordsListClient"');
    expect(pageSource).toContain('import("./_sections/SignedRecordsListClient")');
    expect(pageSource).toContain("next/dynamic");
  });
});
