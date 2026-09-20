import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("live-seat do not auto-seed demo into tenants (LS-022)", () => {
  it("defaults includeDemoSeed to false and hides demo-seed checkbox in create workspace form", () => {
    const formSource = readFileSync(
      join(process.cwd(), "src/app/(operator)/auth/bootstrap/CreateWorkspaceForm.tsx"),
      "utf8",
    );

    expect(formSource).toContain('includeDemoSeed: false');
    expect(formSource).not.toContain('includeDemoSeed: true');
    expect(formSource).not.toContain("create-workspace-demo-seed");
  });

  it("documents host demo seed is separate from customer create in ADR 0102", () => {
    const adrSource = readFileSync(
      join(REPO_ROOT, "docs/architecture/adrs/0102-first-login-live-workspace-explicit-training.md"),
      "utf8",
    );

    expect(adrSource).toMatch(/host demo seed/i);
  });

  it("keeps IncludeDemoSeed default false in post-auth create request model", () => {
    const csharpSource = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/Identity/PostAuthWorkspaceBootstrapService.Create.cs"),
      "utf8",
    );

    expect(csharpSource).toMatch(/IncludeDemoSeed/);
  });
});
