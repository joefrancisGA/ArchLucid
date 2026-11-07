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
    const shellSource = readUiSource(
      "app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewPageShell.tsx",
    );

    expect(newPageSource).toContain("ArchitecturesNewPageShell");
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

    // Lead copy sits on the form card; the wizard shell stays thin.
    expect(fieldsSource).toContain("REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD");
    expect(fieldsSource).toContain("@/lib/create-vs-review-intake-copy");
    expect(fieldsSource).not.toContain("Your first review");
  });

  it("uses drafting-first lead copy on architecture creation surfaces", () => {
    const shellSource = readUiSource(
      "app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewPageShell.tsx",
    );
    const workspaceSource = readUiSource("components/architecture/ArchitectureDraftWorkspace.tsx");
    const headerChromeSource = readUiSource(
      "components/architecture/ArchitectureDraftWorkspaceHeaderChrome.tsx",
    );

    expect(shellSource).toContain("ArchitectureDraftWorkspace");
    expect(shellSource).toContain("ArchitecturesNewPageSubtitle");
    expect(workspaceSource).toContain("architectureDraftDetailPageSubtitle");
    expect(headerChromeSource).toContain("architecture-draft-workspace-lead");
    expect(headerChromeSource).toContain("!isNewDraft");
    expect(headerChromeSource).toContain("{hideContextualHelp ? null : <PageContextualHelpButton />}");
  });

  it("keeps create-architecture href distinct from review intake path hints", () => {
    const pathCopySource = readUiSource("lib/reviews-new-path-copy.ts");

    expect(pathCopySource).toContain("REVIEWS_NEW_CREATE_ARCHITECTURE_HREF");
    expect(pathCopySource).toContain("REVIEWS_NEW_PATH_HINTS");
    expect(pathCopySource).toContain("attach evidence");
    expect(pathCopySource).toContain("/architecture/architectures/new");
  });
});
