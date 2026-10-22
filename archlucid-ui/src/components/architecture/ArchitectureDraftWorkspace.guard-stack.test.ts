import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("ArchitectureDraftWorkspace guard stack (LW-082)", () => {
  const source = readFileSync(join(process.cwd(), "src/components/architecture/ArchitectureDraftWorkspace.tsx"), "utf8");

  it("mounts a single in-app leave dialog via the primitive guard hooks", () => {
    expect(source.match(/<InAppNavigationGuardDialog\b/g)?.length).toBe(1);
    expect(source.match(/useInAppNavigationGuard\(/g)?.length).toBe(1);
    expect(source).not.toContain("useLivelihoodDocumentGuards");
  });
});
