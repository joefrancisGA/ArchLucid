import { describe, expect, it } from "vitest";

import { COMMAND_PALETTE_HANDLER_ACTIONS } from "@/lib/command-palette-handler-actions";
import { resolveVisibleCommandPaletteHandlerActions } from "@/lib/resolve-visible-command-palette-actions";

describe("command-palette-handler-actions", () => {
  it("exposes finding triage actions on findings desk routes", () => {
    const reviewFindings = resolveVisibleCommandPaletteHandlerActions(
      "/architecture/reviews/abc/findings/f-1",
    );
    const governanceFindings = resolveVisibleCommandPaletteHandlerActions("/governance/findings");

    expect(reviewFindings.map((action) => action.id)).toEqual(
      expect.arrayContaining([
        "action-finding-next",
        "action-finding-previous",
        "action-finding-accept",
        "action-finding-remediate",
        "action-finding-reject",
      ]),
    );
    expect(governanceFindings.map((action) => action.id)).toEqual(
      expect.arrayContaining(["action-finding-next", "action-finding-previous"]),
    );
  });

  it("hides undo when no reversible control is visible", () => {
    const actions = resolveVisibleCommandPaletteHandlerActions("/architecture/reviews");

    expect(actions.some((action) => action.id === "action-undo-mutation")).toBe(false);
  });

  it("keeps save-draft scoped to architecture draft workspace", () => {
    const draftAction = COMMAND_PALETTE_HANDLER_ACTIONS.find((action) => action.id === "action-save-draft");

    expect(draftAction?.isAvailable("/architecture/architectures/draft-1")).toBe(true);
    expect(draftAction?.isAvailable("/architecture/reviews")).toBe(false);
  });
});
