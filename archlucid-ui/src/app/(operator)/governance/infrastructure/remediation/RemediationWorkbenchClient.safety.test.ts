import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REMEDIATION_UI_ROOT = join(
  process.cwd(),
  "src/app/(operator)/governance/infrastructure/remediation",
);

describe("remediation UI safety copy", () => {
  it("does not reference terraform apply in remediation workbench code paths", () => {
    const clientSource = readFileSync(join(REMEDIATION_UI_ROOT, "RemediationWorkbenchClient.tsx"), "utf8");

    expect(clientSource.toLowerCase()).not.toContain("terraform apply");
    expect(clientSource).toContain("REMEDIATION_EXECUTE_DISCLAIMER");
  });
});
