import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "GovernanceWorkflowPageContent.tsx"),
  "utf8",
);

describe("GovernanceWorkflowPageContent progressive disclosure", () => {
  it("collapses operator quickstart behind advanced accordion", () => {
    expect(source).toContain('triggerLabel="Approval workflow quickstart"');
    expect(source).toContain("GovernanceInteractiveQuickstartCard");
    expect(source).not.toMatch(/\)\s*:\s*\(\s*\n\s*<GovernanceInteractiveQuickstartCard \/>/);
  });

  it("labels promotions accordion and adds stable test id", () => {
    expect(source).toContain('data-testid="governance-workflow-advanced-options"');
    expect(source).toContain('triggerLabel="Environment promotions and activations"');
  });
});
