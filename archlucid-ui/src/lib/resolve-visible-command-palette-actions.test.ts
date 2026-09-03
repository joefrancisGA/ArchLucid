import { describe, expect, it } from "vitest";

import {
  resolveVisibleCommandPaletteHandlerActions,
  resolveVisibleCommandPaletteHrefActions,
} from "@/lib/resolve-visible-command-palette-actions";

describe("resolve-visible-command-palette-actions (PT-06)", () => {
  it("omits finish workspace setup in Working mode", () => {
    const workingActions = resolveVisibleCommandPaletteHrefActions(true);
    const guidedActions = resolveVisibleCommandPaletteHrefActions(false);

    expect(workingActions.some((action) => action.id === "action-finish-setup")).toBe(false);
    expect(guidedActions.some((action) => action.id === "action-finish-setup")).toBe(true);
  });

  it("exposes save draft handler on architecture draft routes", () => {
    const draftActions = resolveVisibleCommandPaletteHandlerActions("/architecture/architectures/new");
    const homeActions = resolveVisibleCommandPaletteHandlerActions("/");

    expect(draftActions.some((action) => action.id === "action-save-draft")).toBe(true);
    expect(homeActions.some((action) => action.id === "action-save-draft")).toBe(false);
  });
});
