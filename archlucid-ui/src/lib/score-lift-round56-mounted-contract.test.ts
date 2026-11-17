import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round56 mounted contract", () => {
  it("drift workbench exposes empty diffs and unchanged-filter test ids", () => {
    const source = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");

    expect(source).toContain('data-testid="infra-drift-diffs-empty-not-failure"');
    expect(source).toContain('data-testid="infra-drift-diffs-empty-unchanged-filter-off"');
  });

  it("infrastructure Ask exposes insufficient-evidence snapshot scope test id", () => {
    const source = readUiSource("app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx");

    expect(source).toContain('data-testid="infra-ask-insufficient-evidence-scope"');
    expect(source).toContain('data-testid="infra-ask-stale-snapshot-citation"');
  });

  it("decision register load failure mounts report problem row", () => {
    const source = readUiSource("app/(operator)/governance/decision-register/_sections/DecisionRegisterLoadFailure.tsx");

    expect(source).toContain('data-testid="decision-register-load-failure"');
    expect(source).toContain("FatalPageReportProblemSupportRow");
  });
});