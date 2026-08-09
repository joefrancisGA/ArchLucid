import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const CLIENT_DRIVEN_LAYOUTS = [
  "src/app/(operator)/architecture/digests/layout.tsx",
  "src/app/(operator)/governance/advisory-scans/layout.tsx",
  "src/app/(operator)/integrations/layout.tsx",
  "src/app/(operator)/insights/ask-review-questions/layout.tsx",
] as const;

describe("operator client-driven route layouts (TB-2123)", () => {
  it.each(CLIENT_DRIVEN_LAYOUTS)("does not blanket force-dynamic on %s", (relativePath) => {
    const source = readFileSync(join(repoRoot, relativePath), "utf8");

    expect(source).not.toContain('export const dynamic = "force-dynamic"');
    expect(source).toContain("OperatorClientDrivenRouteLayout");
  });
});
