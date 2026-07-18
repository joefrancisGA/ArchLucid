import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readUiSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("create vs review intake differentiation (TB-747)", () => {
  it("routes legacy create intent away from /reviews/new to the architecture draft bootstrap", () => {
    const pageSource = readUiSource("app/(operator)/reviews/new/page.tsx");

    expect(pageSource).toContain("redirect(ARCHITECTURES_NEW_PATH)");
    expect(pageSource).toContain("CREATE_ARCHITECTURE_INTENT");
  });

  it("uses evidence-first progress copy on the quick review intake wizard", () => {
    const wizardSource = readUiSource("app/(operator)/reviews/new/FirstPilotIntakeWizard.tsx");

    expect(wizardSource).toContain("REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_TITLE");
    expect(wizardSource).toContain("REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD");
    expect(wizardSource).toContain("@/lib/create-vs-review-intake-copy");
    expect(wizardSource).not.toContain("Your first review");
  });

  it("uses drafting-first lead copy on architecture creation surfaces", () => {
    const bootstrapPageSource = readUiSource("app/(operator)/architectures/new/page.tsx");
    const workspaceSource = readUiSource("components/architecture/ArchitectureDraftWorkspace.tsx");

    expect(bootstrapPageSource).toContain("ARCHITECTURE_CREATION_BOOTSTRAP_LEAD");
    expect(workspaceSource).toContain("ARCHITECTURE_DRAFT_WORKSPACE_LEAD");
    expect(workspaceSource).toContain("architecture-draft-workspace-lead");
  });

  it("keeps create-architecture path tab hints distinct from review path hints", () => {
    const pathCopySource = readUiSource("lib/reviews-new-path-copy.ts");

    expect(pathCopySource).toContain("REVIEWS_NEW_CREATE_ARCHITECTURE_PATH_HINTS");
    expect(pathCopySource).toContain("REVIEWS_NEW_PATH_HINTS");
    expect(pathCopySource).toContain("attach evidence");
  });
});
