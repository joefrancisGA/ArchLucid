import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("archlucid stack doctor drift guard (TB-658)", () => {
  it("wires stack doctor through the CLI registry and stack handler", () => {
    const program = readRepoFile("ArchLucid.Cli/Program.cs");
    const registry = readRepoFile("ArchLucid.Cli/CommandRegistry.cs");
    const scaffold = readRepoFile("ArchLucid.Cli/CommandRegistry.Scaffold.cs");
    const handlers = readRepoFile("ArchLucid.Cli/CliCommandHandlers.Misc.cs");

    // Guard the actual registry-to-handler dispatch path, not the retired Program.cs switch.
    expect(program).toContain("CommandRegistry.Default.DispatchAsync(normalized)");
    expect(registry).toContain("registry.RegisterScaffoldCommands();");
    expect(scaffold).toMatch(/new CommandDescriptor\(\s*"stack",[\s\S]*?\),\s*CliCommandHandlers\.HandleStack\)/);
    expect(scaffold).toContain("stack doctor");
    expect(handlers).toContain('string.Equals(normalized[1], "doctor", StringComparison.Ordinal)');
    expect(handlers).toContain("StackDoctorCommand.RunAsync");
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
