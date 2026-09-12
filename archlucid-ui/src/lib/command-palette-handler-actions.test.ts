import { describe, expect, it } from "vitest";

import {
  COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT,
  COMMAND_PALETTE_FINALIZE_REVIEW_EVENT,
  COMMAND_PALETTE_FINDING_NEXT_EVENT,
  COMMAND_PALETTE_HANDLER_ACTIONS,
  dispatchCommandPaletteHandlerAction,
  isAlertsWorkPath,
  isArchitectureDraftWorkPath,
  isCommandPaletteReversibleUndoAvailable,
  isFindingsWorkPath,
  isReviewDetailWorkPath,
} from "@/lib/command-palette-handler-actions";
import {
  isCommandPaletteCloneFromSnapshotAvailable,
  isCommandPaletteFinalizeReviewAvailable,
} from "@/lib/command-palette-work-action-dom";
import { resolveVisibleCommandPaletteHandlerActions } from "@/lib/resolve-visible-command-palette-actions";

describe("command-palette-handler-actions (LI-07 / WD-05)", () => {
  it("classifies draft, findings, review-detail, and alerts work paths", () => {
    expect(isArchitectureDraftWorkPath("/architecture/architectures/new")).toBe(true);
    expect(isArchitectureDraftWorkPath("/architecture/reviews")).toBe(false);
    expect(isFindingsWorkPath("/governance/findings")).toBe(true);
    expect(isFindingsWorkPath("/architecture/reviews/run-1")).toBe(true);
    expect(isFindingsWorkPath("/architecture/reviews/abc/findings/f-1")).toBe(true);
    expect(isFindingsWorkPath("/")).toBe(false);
    expect(isAlertsWorkPath("/governance/alerts")).toBe(true);
    expect(isAlertsWorkPath("/governance/findings")).toBe(false);
  });

  it("treats missing undo controls as unavailable", () => {
    expect(isCommandPaletteReversibleUndoAvailable()).toBe(false);
  });

  it("hides undo when no reversible control is visible", () => {
    const actions = resolveVisibleCommandPaletteHandlerActions("/architecture/reviews");

    expect(actions.some((action) => action.id === "action-undo-mutation")).toBe(false);
  });

  it("exposes finding triage actions on findings desk routes", () => {
    const reviewFindings = resolveVisibleCommandPaletteHandlerActions(
      "/architecture/reviews/abc/findings/f-1",
    );
    const governanceFindings = resolveVisibleCommandPaletteHandlerActions("/governance/findings");

    expect(reviewFindings.map((action) => action.id)).toEqual(
      expect.arrayContaining([
        "action-finding-next",
        "action-finding-prev",
        "action-finding-accept",
        "action-finding-remediate",
        "action-finding-reject",
      ]),
    );
    expect(governanceFindings.map((action) => action.id)).toEqual(
      expect.arrayContaining(["action-finding-next", "action-finding-prev"]),
    );
  });

  it("keeps save changes scoped to draft routes or dirty review-detail controls", () => {
    const saveAction = COMMAND_PALETTE_HANDLER_ACTIONS.find((action) => action.id === "action-save-draft");

    expect(saveAction?.label).toBe("Save changes");
    expect(saveAction?.isAvailable("/architecture/architectures/draft-1")).toBe(true);
    expect(saveAction?.isAvailable("/architecture/reviews")).toBe(false);

    document.body.innerHTML = '<button data-testid="finding-disposition-save" type="button">Save</button>';

    expect(saveAction?.isAvailable("/architecture/reviews/run-1/findings/f-1")).toBe(true);
    expect(isReviewDetailWorkPath("/architecture/reviews/run-1/findings/f-1")).toBe(true);
  });

  it("shows finalize review only when the on-page CTA is available", () => {
    const finalizeAction = COMMAND_PALETTE_HANDLER_ACTIONS.find((action) => action.id === "action-finalize-review");

    expect(finalizeAction).toBeDefined();
    expect(finalizeAction?.isAvailable("/architecture/reviews/run-1")).toBe(false);

    document.body.innerHTML = '<button data-testid="commit-run-finalize" type="button">Finalize review</button>';

    expect(isCommandPaletteFinalizeReviewAvailable()).toBe(true);
    expect(finalizeAction?.isAvailable("/architecture/reviews/run-1")).toBe(true);
    expect(finalizeAction?.isAvailable("/governance/findings")).toBe(false);
  });

  it("dispatches finalize review as a window event", () => {
    const seen: string[] = [];
    const onFinalize = () => {
      seen.push("finalize");
    };

    window.addEventListener(COMMAND_PALETTE_FINALIZE_REVIEW_EVENT, onFinalize);
    dispatchCommandPaletteHandlerAction("action-finalize-review");
    window.removeEventListener(COMMAND_PALETTE_FINALIZE_REVIEW_EVENT, onFinalize);

    expect(seen).toEqual(["finalize"]);
  });

  it("SN-033: shows clone from snapshot only on architecture routes with a visible spawn-locked CTA", () => {
    const cloneAction = COMMAND_PALETTE_HANDLER_ACTIONS.find((action) => action.id === "action-clone-from-snapshot");

    expect(cloneAction?.label).toBe("New version (clone)");
    expect(cloneAction?.isAvailable("/architecture/architectures/arch-1")).toBe(false);

    document.body.innerHTML =
      '<button data-testid="architecture-spawn-lock-clone-snapshot" type="button">New version (clone)</button>';

    expect(isCommandPaletteCloneFromSnapshotAvailable()).toBe(true);
    expect(cloneAction?.isAvailable("/architecture/architectures/arch-1")).toBe(true);
    expect(cloneAction?.isAvailable("/architecture/reviews/run-1")).toBe(false);
  });

  it("dispatches clone from snapshot as a window event", () => {
    const seen: string[] = [];
    const onClone = () => {
      seen.push("clone");
    };

    window.addEventListener(COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT, onClone);
    dispatchCommandPaletteHandlerAction("action-clone-from-snapshot");
    window.removeEventListener(COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT, onClone);

    expect(seen).toEqual(["clone"]);
  });

  it("dispatches finding next as a window event", () => {
    const seen: string[] = [];
    const onNext = () => {
      seen.push("next");
    };

    window.addEventListener(COMMAND_PALETTE_FINDING_NEXT_EVENT, onNext);
    dispatchCommandPaletteHandlerAction("action-finding-next");
    window.removeEventListener(COMMAND_PALETTE_FINDING_NEXT_EVENT, onNext);

    expect(seen).toEqual(["next"]);
  });
});
