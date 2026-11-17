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
    const shellSource = readUiSource(
      "app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewPageShell.tsx",
    );

    expect(shellSource).toContain("ArchitectureDraftWorkspace");
    expect(shellSource).toContain("ARCHITECTURE_NEW_DRAFT_SEGMENT");
    expect(shellSource).not.toContain("ArchitectureCreationBootstrap");
    expect(shellSource).toContain("OperatorPageHeader");
    expect(shellSource).toContain('headingLevel="h1"');
    expect(shellSource).toContain("ArchitecturesNewPageHeaderActions");
    expect(shellSource).toContain("ArchitecturesNewPageSubtitle");
    expect(shellSource).toContain("architecture-new-page-subtitle");
    expect(shellSource).not.toContain("START_NEW_ARCHITECTURE_LABEL");
  });

  it("uses evidence-first progress copy on the quick review intake wizard", () => {
    const fieldsSource = readUiSource("app/(operator)/architecture/reviews/new/FirstPilotIntakeFields.tsx");

    // Lead copy now sits on the form card; the separate section header above it was duplicate instruction.
    expect(fieldsSource).toContain("REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD");
    expect(fieldsSource).toContain("@/lib/create-vs-review-intake-copy");
    expect(fieldsSource).not.toContain("Your first review");
  });

  it("uses drafting-first lead copy on architecture creation surfaces", () => {
    const shellSource = readUiSource(
      "app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewPageShell.tsx",
    );
    const headerChromeSource = readUiSource(
      "components/architecture/ArchitectureDraftWorkspaceHeaderChrome.tsx",
    );

    expect(shellSource).toContain("ArchitectureDraftWorkspace");
    expect(shellSource).toContain("ArchitecturesNewPageSubtitle");
    expect(headerChromeSource).toContain("ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE");
    expect(headerChromeSource).toContain("architecture-draft-workspace-lead");
    expect(headerChromeSource).toContain("{!isNewDraft ? (");
    expect(headerChromeSource).toContain("PageContextualHelpButton");
  });

  it("keeps create-architecture href distinct from review intake path hints", () => {
    const pathCopySource = readUiSource("lib/reviews-new-path-copy.ts");

    expect(pathCopySource).toContain("REVIEWS_NEW_CREATE_ARCHITECTURE_HREF");
    expect(pathCopySource).toContain("REVIEWS_NEW_PATH_HINTS");
    expect(pathCopySource).toContain("attach evidence");
    expect(pathCopySource).toContain("/architecture/architectures/new");
  });
});
