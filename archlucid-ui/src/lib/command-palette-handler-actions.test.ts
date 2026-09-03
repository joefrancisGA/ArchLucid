import { describe, expect, it } from "vitest";

import {
  dispatchCommandPaletteHandlerAction,
  isAlertsWorkPath,
  isArchitectureDraftWorkPath,
  isCommandPaletteReversibleUndoAvailable,
  isFindingsWorkPath,
  COMMAND_PALETTE_FINDING_NEXT_EVENT,
} from "@/lib/command-palette-handler-actions";

describe("command-palette-handler-actions (LI-07)", () => {
  it("classifies draft, findings, review-detail, and alerts work paths", () => {
    expect(isArchitectureDraftWorkPath("/architecture/architectures/new")).toBe(true);
    expect(isArchitectureDraftWorkPath("/architecture/reviews")).toBe(false);
    expect(isFindingsWorkPath("/governance/findings")).toBe(true);
    expect(isFindingsWorkPath("/architecture/reviews/run-1")).toBe(true);
    expect(isFindingsWorkPath("/")).toBe(false);
    expect(isAlertsWorkPath("/governance/alerts")).toBe(true);
    expect(isAlertsWorkPath("/governance/findings")).toBe(false);
  });

  it("treats missing undo controls as unavailable", () => {
    expect(isCommandPaletteReversibleUndoAvailable()).toBe(false);
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
