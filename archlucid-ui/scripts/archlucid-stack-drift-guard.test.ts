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

  it("wires stack commands in ArchLucid.Cli Program.cs", () => {
    const program = readRepoFile("ArchLucid.Cli/Program.cs");

    expect(program).toContain('case "stack"');
    expect(program).toContain("StackInitCommand");
    expect(program).toContain("StackDiffCommand");
  });
});
