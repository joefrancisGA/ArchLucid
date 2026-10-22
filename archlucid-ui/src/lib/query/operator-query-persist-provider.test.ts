import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("OperatorQueryProvider persistence wiring (TB-2165)", () => {
  it("starts sessionStorage persistence for the browser query client", () => {
    const source = readFileSync(join(repoRoot, "src/components/operator/OperatorQueryProvider.tsx"), "utf8");

    expect(source).toContain("setupOperatorQueryClientPersistence");
    expect(source).toContain("useEffect");
  });
});
