import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("archlucid stack answers drift guard (TB-654)", () => {
  it("ships stack schema and example answers file", () => {
    const schema = readRepoFile("deploy/archlucid.stack.schema.json");
    const example = readRepoFile("deploy/archlucid.stack.example.yaml");

    expect(schema).toContain('"schemaVersion"');
    expect(example).toContain("schemaVersion: 1");
    expect(example).toContain("azure:");
  });

  it("documents stack init in FIRST_AZURE_DEPLOYMENT.md", () => {
    const doc = readRepoFile("docs/library/FIRST_AZURE_DEPLOYMENT.md");

    expect(doc).toContain("TB-654");
    expect(doc).toContain("archlucid stack init");
    expect(doc).toContain("archlucid.stack");
  });

  it("wires stack init/diff/doctor through the CLI command registry", () => {
    const program = readRepoFile("ArchLucid.Cli/Program.cs");
    const registry = readRepoFile("ArchLucid.Cli/CommandRegistry.cs");
    const scaffold = readRepoFile("ArchLucid.Cli/CommandRegistry.Scaffold.cs");
    const handlers = readRepoFile("ArchLucid.Cli/CliCommandHandlers.Misc.cs");

    // The CLI now uses CommandRegistry instead of a Program.cs switch.
    // Guard every hop in the actual dispatch chain, not a stale switch.
    expect(program).toContain("CommandRegistry.Default.DispatchAsync(normalized)");
    expect(registry).toContain("registry.RegisterScaffoldCommands();");
    expect(scaffold).toMatch(/new CommandDescriptor\(\s*"stack",[\s\S]*?\),\s*CliCommandHandlers\.HandleStack\)/);
    expect(handlers).toContain('string.Equals(normalized[1], "init", StringComparison.Ordinal)');
    expect(handlers).toContain('string.Equals(normalized[1], "diff", StringComparison.Ordinal)');
    expect(handlers).toContain('string.Equals(normalized[1], "doctor", StringComparison.Ordinal)');
    expect(handlers).toContain("StackInitCommand.RunAsync");
    expect(handlers).toContain("StackDiffCommand.RunAsync");
    expect(handlers).toContain("StackDoctorCommand.RunAsync");
  });
});
