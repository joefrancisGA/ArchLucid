import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT,
  dispatchCommandPaletteHandlerAction,
} from "@/lib/command-palette-handler-actions";
import { isCommandPaletteCloneFromSnapshotAvailable } from "@/lib/command-palette-work-action-dom";
import { resolveVisibleCommandPaletteHandlerActions } from "@/lib/resolve-visible-command-palette-actions";
import {
  resolveSystemNotJobPaletteCloneNewVersionVisible,
  SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID,
  SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_DOC_ANCHOR,
  SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER,
} from "@/lib/system-not-job-palette-clone-new-version";
import { SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL } from "@/lib/system-not-job-clone-from-snapshot-entry";

const repoRoot = join(__dirname, "..", "..", "..");

describe("system-not-job palette clone new version (SN-033)", () => {
  it("names palette handler metadata and spawn-lock discovery test id", () => {
    expect(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID).toBe("action-clone-from-snapshot");
    expect(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER.label).toBe(
      SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
    );
    expect(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER.domTestId).toBe(
      "architecture-spawn-lock-clone-snapshot",
    );
    expect(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER.eventName).toBe(
      "archlucid-command-palette-clone-from-snapshot",
    );
    expect(COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT).toBe(
      SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER.eventName,
    );
  });

  it("hides palette clone when spawn-lock CTA is not on the page", () => {
    document.body.innerHTML = "";

    expect(isCommandPaletteCloneFromSnapshotAvailable()).toBe(false);
    expect(resolveSystemNotJobPaletteCloneNewVersionVisible("/architecture/architectures/arch-1")).toBe(
      false,
    );

    const visible = resolveVisibleCommandPaletteHandlerActions("/architecture/architectures/arch-1");

    expect(visible.some((action) => action.id === SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID)).toBe(
      false,
    );
  });

  it("shows palette clone on architecture draft routes when spawn-lock CTA is visible", () => {
    document.body.innerHTML =
      '<button data-testid="architecture-spawn-lock-clone-snapshot" type="button">New version (clone)</button>';

    expect(resolveSystemNotJobPaletteCloneNewVersionVisible("/architecture/architectures/arch-1/drafts/d-1")).toBe(
      true,
    );

    const visible = resolveVisibleCommandPaletteHandlerActions("/architecture/architectures/arch-1/drafts/d-1");

    expect(visible.map((action) => action.id)).toContain(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID);
  });

  it("does not expose clone on non-architecture routes even when CTA is visible", () => {
    document.body.innerHTML =
      '<button data-testid="architecture-spawn-lock-clone-snapshot" type="button">New version (clone)</button>';

    expect(resolveSystemNotJobPaletteCloneNewVersionVisible("/architecture/reviews/run-1")).toBe(false);
  });

  it("dispatches clone handler through the palette event bridge", () => {
    const seen: string[] = [];
    const onClone = () => {
      seen.push("clone");
    };

    window.addEventListener(COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT, onClone);
    dispatchCommandPaletteHandlerAction(SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID);
    window.removeEventListener(COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT, onClone);

    expect(seen).toEqual(["clone"]);
  });

  it("wires SN-009 cost-cap confirm through clone control and handler module", () => {
    const cloneControl = readFileSync(
      join(repoRoot, "archlucid-ui/src/components/architecture/ArchitectureDraftCloneSnapshotControl.tsx"),
      "utf8",
    );
    const confirmDialog = readFileSync(
      join(
        repoRoot,
        "archlucid-ui/src/components/architecture/ArchitectureDraftCloneSnapshotConfirmDialog.tsx",
      ),
      "utf8",
    );
    const handlers = readFileSync(join(repoRoot, "archlucid-ui/src/lib/command-palette-handler-actions.ts"), "utf8");

    expect(cloneControl).toContain("ArchitectureDraftCloneSnapshotConfirmDialog");
    expect(confirmDialog).toContain("ArchitectureWhatIfCostCapChrome");
    expect(confirmDialog).toContain("resolveDraftBranchWhatIfCostCapChrome");
    expect(handlers).toContain("resolveSystemNotJobPaletteCloneNewVersionVisible");
    expect(handlers).toContain("SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER");
  });

  it("points at ADR 0092 for cheap-envelope clone policy", () => {
    const adr = readFileSync(join(repoRoot, SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_DOC_ANCHOR), "utf8");

    expect(adr).toContain("0092");
    expect(adr).toContain("clone");
  });
});
