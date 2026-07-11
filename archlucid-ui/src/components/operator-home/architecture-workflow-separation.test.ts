import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const dualPathSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "OperatorHomeDualPathCards.tsx"),
  "utf8",
);

const socraticSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../app/(operator)/reviews/new/SocraticIntakeWizard.tsx"),
  "utf8",
);

describe("architecture creation vs review workflow separation", () => {
  it("routes homepage create architecture through the dedicated navigation hook", () => {
    expect(dualPathSource).toContain("useCreateArchitectureNavigation");
    expect(dualPathSource).not.toContain("REVIEWS_NEW_GUIDED_INTAKE_HREF");
    expect(dualPathSource).toContain('selectedPath === "create-architecture"');
  });

  it("keeps review staged progress off the create architecture card", () => {
    expect(dualPathSource).toContain("reviewNavigation.showStagedPanel");
    expect(dualPathSource).not.toMatch(/createArchitectureNavigation\.showStagedPanel/);
  });

  it("skips review admission for explicit create-architecture intent", () => {
    expect(socraticSource).toContain("runCreateArchitectureContinuation");
    expect(socraticSource).toContain("isCreateArchitectureFlow");
    expect(socraticSource).toContain("getDraftQuestions(id)");
    expect(socraticSource).toMatch(/void runAdmission\(\)/);
  });
});
