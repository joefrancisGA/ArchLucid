import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { evaluateSystemGravityInstrumentAfterSpawnDoneTest } from "@/lib/system-gravity-instrument-after-spawn-done-test";
import { SYSTEM_GRAVITY_ACCEPTANCE_DOC_PATH } from "@/lib/system-gravity-close-audit";

const REPO_ROOT = join(process.cwd(), "..");

/** ADR 0098 — SG-120 wave close audit ratchet. */
describe("system-gravity wave close audit (SG-120)", () => {
  it("documents acceptance markdown, done tests, and residuals", () => {
    const acceptance = readFileSync(join(REPO_ROOT, SYSTEM_GRAVITY_ACCEPTANCE_DOC_PATH), "utf8");
    const prompts = readFileSync(
      join(REPO_ROOT, "docs/architecture/SYSTEM_GRAVITY_COMPOSER_PROMPTS.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/shell identity is the architecture/i);
    expect(acceptance).toMatch(/Nested review-detail is not Home/i);
    expect(acceptance).toMatch(/Guided.*peer review URLs/i);
    expect(acceptance).toMatch(/Kernels unmerged|DraftRequests.*Runs.*unmerged/i);
    expect(acceptance).toMatch(/CE.*runner not remounted|cheap envelope runner not remounted/i);
    expect(acceptance).toMatch(/AgentExecution:Mode.*Simulator|host Mode unchanged/i);
    expect(acceptance).toMatch(/## Do not claim/);
    expect(acceptance).toMatch(/G-REAL-06/);
    expect(acceptance).toMatch(/insight density/i);
    expect(acceptance).toMatch(/SG-111–118/);

    expect(prompts).toMatch(/SYSTEM_GRAVITY_ACCEPTANCE_2026-09-13\.md/);
    expect(prompts).toMatch(/SG-001–120 landed/);
    expect(prompts).not.toMatch(/SG-001–110 landed/);
  });

  it("SG-106 done-test module passes instrument-after-spawn acceptance predicates", () => {
    const result = evaluateSystemGravityInstrumentAfterSpawnDoneTest({
      architectureDisplayName: "Payments platform",
      reviewTitle: "Q3 card capture migration",
      runId: "run-close-audit-1",
      architectureId: "architecture-identity-001",
    });

    expect(result.shellIdentityIsArchitecture).toBe(true);
    expect(result.reviewDetailIsNestedJob).toBe(true);
    expect(result.guidedKeepsPeerReviewUrls).toBe(true);
    expect(result.findingsReachableAsVerbs).toBe(true);
  });
});
