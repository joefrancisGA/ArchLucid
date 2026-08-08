import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routeDir = dirname(fileURLToPath(import.meta.url));

const pageSource = readFileSync(join(routeDir, "page.tsx"), "utf8");

describe("governance approval-queue deferred imports (TB-934)", () => {
  it("keeps GovernanceWorkflowPageContent off the page static import graph", () => {
    expect(pageSource).not.toContain(
      'import { GovernanceWorkflowPageContent } from "../_sections/GovernanceWorkflowPageContent"',
    );
    expect(pageSource).toContain('import("../_sections/GovernanceWorkflowPageContent")');
    expect(pageSource).toContain("next/dynamic");
    expect(pageSource).not.toContain('"use client"');
  });
});
