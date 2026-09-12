import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_SPAWN_LOCKED_DRAFT_BACK_TO_REVIEW_LABEL,
  resolveSpawnLockedDraftPrimaryBackHref,
} from "@/lib/architecture/working-back-href";

const REPO_ROOT = join(process.cwd(), "..");
const WORKING_BACK_HREF_PATH = "archlucid-ui/src/lib/architecture/working-back-href.ts";
const WORKSPACE_BODY_PATH = "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceBody.tsx";
const HANDOFF_PANEL_PATH = "archlucid-ui/src/components/architecture/ArchitectureDraftHandoffPanel.tsx";
const NESTED_DRAFT_PAGE_PATH =
  "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/drafts/[draftId]/page.tsx";

describe("system-not-job spawn-lock draft back honesty (SN-005)", () => {
  it("declares spawn-locked draft back helpers in working-back-href", () => {
    const moduleSource = readFileSync(join(REPO_ROOT, WORKING_BACK_HREF_PATH), "utf8");

    expect(moduleSource).toContain("resolveSpawnLockedDraftBackLocator");
    expect(moduleSource).toContain("resolveStartReviewSpawnLockedDraftBackHref");
    expect(moduleSource).toContain("isArchitectureDraftWritableEditorRoutePath");
    expect(ARCHITECTURE_SPAWN_LOCKED_DRAFT_BACK_TO_REVIEW_LABEL).toBe("Back to review");
  });

  it("wires spawn-locked back targets into handoff and workspace chrome", () => {
    const workspaceBody = readFileSync(join(REPO_ROOT, WORKSPACE_BODY_PATH), "utf8");
    const handoffPanel = readFileSync(join(REPO_ROOT, HANDOFF_PANEL_PATH), "utf8");
    const nestedDraftPage = readFileSync(join(REPO_ROOT, NESTED_DRAFT_PAGE_PATH), "utf8");

    expect(workspaceBody).toContain("handoffEditorLocked");
    expect(handoffPanel).toContain("resolveSpawnLockedDraftBackLocator");
    expect(handoffPanel).toContain("architecture-draft-spawn-lock-back-honesty");
    expect(nestedDraftPage).toContain("architectureDraftSpawnedRunId");
    expect(nestedDraftPage).toContain("redirect(architectureIdentityPath");
    expect(existsSync(join(REPO_ROOT, WORKING_BACK_HREF_PATH))).toBe(true);
  });

  it("never returns the writable nested draft editor as the spawn-locked primary back href", () => {
    const backHref = resolveSpawnLockedDraftPrimaryBackHref({
      linkedReviewId: "run-001",
      parentArchitectureId: "architecture-identity-001",
    });

    expect(backHref).toBe("/architecture/architectures/architecture-identity-001/reviews/run-001");
    expect(backHref).not.toContain("/drafts/");
  });
});
