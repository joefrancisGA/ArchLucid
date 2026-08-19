import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readUiSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("create vs review intake differentiation (TB-747)", () => {
  it("routes create-architecture intake to the direct draft workspace", () => {
    const newPageSource = readUiSource("app/(operator)/architecture/architectures/new/page.tsx");

    expect(newPageSource).toContain("ArchitectureDraftWorkspace");
    expect(newPageSource).toContain("ARCHITECTURE_NEW_DRAFT_SEGMENT");
    expect(newPageSource).not.toContain("ArchitectureCreationBootstrap");
    expect(newPageSource).toContain("OperatorPageHeader");
    expect(newPageSource).toContain('headingLevel="h1"');
    expect(newPageSource).toContain("ArchitecturesNewPageHeaderActions");
    expect(newPageSource).toContain("ArchitecturesNewPageSubtitle");
    expect(newPageSource).toContain("architecture-new-page-subtitle");
    expect(newPageSource).not.toContain("START_NEW_ARCHITECTURE_LABEL");
  });

  it("uses evidence-first progress copy on the quick review intake wizard", () => {
    const wizardSource = readUiSource("app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.tsx");

    // Lead copy now sits on the form card; the separate section header above it was duplicate instruction.
    expect(wizardSource).toContain("REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD");
    expect(wizardSource).toContain("@/lib/create-vs-review-intake-copy");
    expect(wizardSource).not.toContain("Your first review");
  });

  it("uses drafting-first lead copy on architecture creation surfaces", () => {
    const newPageSource = readUiSource("app/(operator)/architecture/architectures/new/page.tsx");
    const workspaceSource = readUiSource("components/architecture/ArchitectureDraftWorkspace.tsx");

    expect(newPageSource).toContain("ArchitectureDraftWorkspace");
    expect(workspaceSource).toContain("ARCHITECTURE_DRAFT_WORKSPACE_LEAD");
    expect(workspaceSource).toContain("architecture-draft-workspace-lead");
    expect(workspaceSource).toContain("ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD");
    expect(workspaceSource).toContain("ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE");
    expect(workspaceSource).toContain("architecture-creation-new-draft-section-title");
    expect(workspaceSource).toContain("{isNewDraft ? null : <PageContextualHelpButton />}");
  });

  it("keeps create-architecture href distinct from review intake path hints", () => {
    const pathCopySource = readUiSource("lib/reviews-new-path-copy.ts");

    expect(pathCopySource).toContain("REVIEWS_NEW_CREATE_ARCHITECTURE_HREF");
    expect(pathCopySource).toContain("REVIEWS_NEW_PATH_HINTS");
    expect(pathCopySource).toContain("attach evidence");
    expect(pathCopySource).toContain("/architecture/architectures/new");
  });
});
