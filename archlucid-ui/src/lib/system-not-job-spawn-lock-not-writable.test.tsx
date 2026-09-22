import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { architectureCreationDefaultActorSet } from "@/lib/architecture/architecture-creation-init";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  listSystemNotJobSpawnLockedDualEditorRows,
  resolveSystemNotJobSpawnLockedFieldRowsForRatchet,
  SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_DOC_ANCHOR,
  SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_OWNER,
  SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_SURFACES,
  SYSTEM_NOT_JOB_SPAWN_LOCKED_ARCHITECTURE_FIELD_TEST_IDS,
  SYSTEM_NOT_JOB_SPAWN_LOCKED_PATCH_BLOCKED_MESSAGE,
} from "@/lib/system-not-job-spawn-lock-not-writable";

const REPO_ROOT = join(process.cwd(), "..");

vi.mock("@/components/draft-intake/DraftIntakeActorEditor", () => ({
  DraftIntakeActorEditor: (props: { disabled?: boolean }) => (
    <div data-testid="draft-intake-actor-editor" data-disabled={props.disabled === true ? "true" : "false"} />
  ),
}));

vi.mock("@/components/architecture/ArchitectureDraftStructuredBriefFields", () => ({
  ArchitectureDraftStructuredBriefFields: (props: { disabled?: boolean }) => (
    <div
      data-testid="architecture-draft-structured-brief-stub"
      data-disabled={props.disabled === true ? "true" : "false"}
    />
  ),
}));

vi.mock("@/components/architecture/ArchitectureDraftOverviewRewritePanel", () => ({
  ArchitectureDraftOverviewRewritePanel: () => null,
}));

vi.mock("@/hooks/use-workspace-system-name-availability", () => ({
  useWorkspaceSystemNameAvailability: () => ({
    validationReady: false,
    isAvailable: true,
    conflictMessage: null,
  }),
}));

describe("SN-031 spawn-locked draft not writable ratchet", () => {
  it("names SN-031 owner and dual-editor inventory anchor", () => {
    expect(SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_OWNER).toBe("SN-031");
    expect(SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_DOC_ANCHOR).toContain(
      "SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md",
    );
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_DOC_ANCHOR))).toBe(true);
  });

  it("lists every spawn-locked dual-editor narrative field for SN-004 one-writer", () => {
    const lockedFields = resolveSystemNotJobSpawnLockedFieldRowsForRatchet();

    expect(lockedFields).toContain("systemName");
    expect(lockedFields).toContain("freeTextIntent");
    expect(lockedFields).toContain("autosavePatch");
    expect(listSystemNotJobSpawnLockedDualEditorRows().every((row) => row.spawnLocked)).toBe(true);
    expect(
      listSystemNotJobSpawnLockedDualEditorRows().every((row) => !row.parallelLiveEditAfterSpawn),
    ).toBe(true);
  });

  it("wires disabled spawn-locked fields through ArchitectureDraftFormFields", () => {
    const formFields = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftFormFields.tsx"),
      "utf8",
    );

    for (const testId of SYSTEM_NOT_JOB_SPAWN_LOCKED_ARCHITECTURE_FIELD_TEST_IDS) {
      expect(formFields).toContain(testId);
    }

    expect(formFields).toMatch(/disabled=\{props\.disabled === true\}/);
  });

  it("disables every spawn-locked architecture field when editorLocked is true", () => {
    render(
      <ArchitectureDraftFormFields
        fields={{
          freeTextIntent: "Intent",
          businessOutcome: "Outcome",
          systemName: "Payments",
          structuredBrief: emptyArchitectureDraftStructuredBrief(),
          openQuestions: "Who owns access reviews?",
        }}
        actorSet={architectureCreationDefaultActorSet()}
        disabled
        onFieldsChange={() => undefined}
        onActorSetChange={() => undefined}
      />,
    );

    for (const testId of SYSTEM_NOT_JOB_SPAWN_LOCKED_ARCHITECTURE_FIELD_TEST_IDS) {
      expect(screen.getByTestId(testId)).toBeDisabled();
    }

    expect(screen.getByTestId("draft-intake-actor-editor")).toHaveAttribute("data-disabled", "true");
    expect(screen.getByTestId("architecture-draft-structured-brief-stub")).toHaveAttribute(
      "data-disabled",
      "true",
    );
  });

  it("anchors autosave off and handoff layout when handoffEditorLocked", () => {
    const draftWorkspace = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspace.tsx"),
      "utf8",
    );
    const workspaceBody = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceBody.tsx"),
      "utf8",
    );
    const workspaceHook = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/hooks/use-architecture-draft-workspace.ts"),
      "utf8",
    );

    expect(draftWorkspace).toMatch(/enabled:\s*!handoffEditorLocked/);
    expect(workspaceHook).toContain("handoffEditorLocked = linkedReviewId !== null");
    expect(workspaceBody).toContain("shouldRenderSpawnLockedHandoffLayout");
    expect(workspaceBody).toContain("ArchitectureDraftHandoffPanel");
  });

  it("keeps server PATCH blocked for RunSpawned drafts without weakening CAS", () => {
    const mutateStage = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/Drafts/Stages/DraftRequestMutateStage.cs"),
      "utf8",
    );
    const stateMachine = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/Drafts/DraftRequestStateMachine.cs"),
      "utf8",
    );

    expect(stateMachine).toContain("IsMutable(DraftRequestStatus status) => status == DraftRequestStatus.Drafting");
    expect(mutateStage).toContain("DraftRequestStateMachine.IsMutable(existing.Status)");
    expect(mutateStage).toContain(SYSTEM_NOT_JOB_SPAWN_LOCKED_PATCH_BLOCKED_MESSAGE);
    expect(mutateStage).toContain("DraftPatchStaleUpdatedUtcGuard.EnsurePatchNotStaleOrThrow");
    expect(mutateStage).not.toContain("ForceOverwrite == true && existing.Status");
  });

  it("documents ratchet surfaces for spawn-lock writability", () => {
    for (const relativePath of SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_SURFACES) {
      expect(existsSync(join(REPO_ROOT, relativePath))).toBe(true);
    }
  });
});
