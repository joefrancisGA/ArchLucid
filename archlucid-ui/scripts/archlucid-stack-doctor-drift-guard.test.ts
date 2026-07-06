import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("archlucid stack doctor drift guard (TB-658)", () => {
  it("wires stack doctor in ArchLucid.Cli Program.cs", () => {
    const program = readRepoFile("ArchLucid.Cli/Program.cs");

    expect(program).toContain('case "stack"');
    expect(program).toContain("StackDoctorCommand");
    expect(program).toContain("stack doctor");
  });

  it("ships StackDoctor orchestration under ArchLucid.Cli/Stack/Doctor", () => {
    const orchestrator = readRepoFile("ArchLucid.Cli/Stack/Doctor/StackDoctorOrchestrator.cs");
    const stepPlan = readRepoFile("ArchLucid.Cli/Stack/Doctor/StackDoctorStepPlan.cs");

    expect(orchestrator).toContain("Test-ArchLucidPrerequisites.ps1");
    expect(orchestrator).toContain("Assert-TerraformDeploymentDriftPreflight.ps1");
    expect(stepPlan).toContain("StackDoctorProfile.StagingDeploy");
    expect(stepPlan).toContain("StackDoctorProfile.PostDeploy");
  });

  it("documents stack doctor in FIRST_AZURE_DEPLOYMENT.md", () => {
    const doc = readRepoFile("docs/library/FIRST_AZURE_DEPLOYMENT.md");

    expect(doc).toContain("TB-658");
    expect(doc).toContain("stack doctor");
  });

  it("documents stack doctor profile matrix in PILOT_PREREQUISITES.md", () => {
    const doc = readRepoFile("docs/runbooks/PILOT_PREREQUISITES.md");

    expect(doc).toContain("TB-658");
    expect(doc).toContain("stack doctor");
  });
});
