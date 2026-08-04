import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readUiSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("create vs review intake differentiation (TB-747)", () => {
  it("routes create-architecture intake to the canonical architecture draft bootstrap", () => {
    const bootstrapPageSource = readUiSource("app/(operator)/architecture/architectures/new/page.tsx");

    expect(bootstrapPageSource).toContain("ARCHITECTURE_CREATION_BOOTSTRAP_LEAD");
    expect(bootstrapPageSource).toContain("ARCHITECTURES_NEW_PATH");
  });

  it("uses evidence-first progress copy on the quick review intake wizard", () => {
    const wizardSource = readUiSource("app/(operator)/reviews/new/FirstPilotIntakeWizard.tsx");

    expect(wizardSource).toContain("REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_TITLE");
    expect(wizardSource).toContain("REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD");
    expect(wizardSource).toContain("@/lib/create-vs-review-intake-copy");
    expect(wizardSource).not.toContain("Your first review");
  });

  it("uses drafting-first lead copy on architecture creation surfaces", () => {
    const bootstrapPageSource = readUiSource("app/(operator)/architecture/architectures/new/page.tsx");
    const workspaceSource = readUiSource("components/architecture/ArchitectureDraftWorkspace.tsx");

    expect(bootstrapPageSource).toContain("ARCHITECTURE_CREATION_BOOTSTRAP_LEAD");
    expect(workspaceSource).toContain("ARCHITECTURE_DRAFT_WORKSPACE_LEAD");
    expect(workspaceSource).toContain("architecture-draft-workspace-lead");
  });

  it("keeps create-architecture href distinct from review intake path hints", () => {
    const pathCopySource = readUiSource("lib/reviews-new-path-copy.ts");

    expect(pathCopySource).toContain("REVIEWS_NEW_CREATE_ARCHITECTURE_HREF");
    expect(pathCopySource).toContain("REVIEWS_NEW_PATH_HINTS");
    expect(pathCopySource).toContain("attach evidence");
    expect(pathCopySource).toContain("/architecture/architectures/new");
  });
});
