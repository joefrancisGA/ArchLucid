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

  it("hides Guided first-session Operate palette rows until first commit (CD-08)", () => {
    const lockedGuided = resolveVisibleCommandPaletteHrefActions({
      workingMode: false,
      hasCommittedArchitectureReview: false,
      showFullNav: false,
    });

    expect(lockedGuided.some((action) => action.href === "/insights/sponsor-report")).toBe(false);
    expect(lockedGuided.some((action) => action.href === "/architecture/reviews")).toBe(true);
  });

  it("keeps Guided first-session rows when the sidebar escape hatch or first commit applies (CD-08)", () => {
    const expandedGuided = resolveVisibleCommandPaletteHrefActions({
      workingMode: false,
      hasCommittedArchitectureReview: false,
      showFullNav: true,
    });
    const committedGuided = resolveVisibleCommandPaletteHrefActions({
      workingMode: false,
      hasCommittedArchitectureReview: true,
      showFullNav: false,
    });

    expect(expandedGuided.some((action) => action.href === "/insights/sponsor-report")).toBe(true);
    expect(committedGuided.some((action) => action.href === "/insights/sponsor-report")).toBe(true);
  });

  it("filters Working palette href actions to sidebar-visible destinations (SD-11)", () => {
    const visible = new Set<string>(["/architecture/reviews", "/architecture/architectures/new"]);
    const workingActions = resolveVisibleCommandPaletteHrefActions({
      workingMode: true,
      visibleNavHrefs: visible,
    });

    expect(workingActions.some((action) => action.href === "/insights/sponsor-report")).toBe(false);
    expect(workingActions.some((action) => action.href === "/architecture/reviews")).toBe(true);
  });

  it("AO-41: filters eval-admin palette rows in Working mode", () => {
    const visible = new Set<string>(["/insights/sponsor-report", "/architecture/reviews"]);
    const actions = resolveVisibleCommandPaletteHrefActions({
      workingMode: true,
      visibleNavHrefs: visible,
      lastOpenArchitectureId: "architecture-identity-001",
    });

    expect(actions.some((action) => action.href === "/insights/sponsor-report")).toBe(false);
    expect(actions.some((action) => action.href === "/architecture/reviews")).toBe(true);
  });

  it("maps Working create action to a single New review draft-editor href (WA-02)", () => {
    const workingActions = resolveVisibleCommandPaletteHrefActions(true);
    const guidedActions = resolveVisibleCommandPaletteHrefActions(false);
    const workingCreate = workingActions.find((action) => action.id === "action-create-review");
    const guidedCreate = guidedActions.find((action) => action.id === "action-create-review");

    expect(workingCreate?.label).toBe("New review");
    expect(workingCreate?.href).toBe("/architecture/architectures/new");
    expect(guidedCreate?.href).toBe("/architecture/reviews/new");
  });

  it("exposes save draft handler on architecture draft routes", () => {
    const draftActions = resolveVisibleCommandPaletteHandlerActions("/architecture/architectures/new");
    const homeActions = resolveVisibleCommandPaletteHandlerActions("/");

    expect(draftActions.some((action) => action.id === "action-save-draft")).toBe(true);
    expect(homeActions.some((action) => action.id === "action-save-draft")).toBe(false);
  });

  it("omits undo on Home when no reversible mutation callout is active (LI-07)", () => {
    const homeActions = resolveVisibleCommandPaletteHandlerActions("/");

    expect(homeActions.some((action) => action.id === "action-undo-mutation")).toBe(false);
  });

  it("exposes undo only when a reversible mutation callout is active (LI-07)", () => {
    const homeActions = resolveVisibleCommandPaletteHandlerActions("/", { reversibleUndoAvailable: true });

    expect(homeActions.some((action) => action.id === "action-undo-mutation")).toBe(true);
  });

  it("exposes finding work actions on findings and review-detail routes (LI-07)", () => {
    const findingsActions = resolveVisibleCommandPaletteHandlerActions("/governance/findings");
    const reviewActions = resolveVisibleCommandPaletteHandlerActions("/architecture/reviews/run-1");
    const homeActions = resolveVisibleCommandPaletteHandlerActions("/");

    expect(findingsActions.some((action) => action.id === "action-finding-next")).toBe(true);
    expect(findingsActions.some((action) => action.id === "action-finding-accept")).toBe(true);
    expect(reviewActions.some((action) => action.id === "action-finding-prev")).toBe(true);
    expect(homeActions.some((action) => action.id === "action-finding-next")).toBe(false);
  });

  it("exposes alert work actions on the alerts inbox (LI-07)", () => {
    const alertActions = resolveVisibleCommandPaletteHandlerActions("/governance/alerts");
    const homeActions = resolveVisibleCommandPaletteHandlerActions("/");

    expect(alertActions.some((action) => action.id === "action-alert-acknowledge")).toBe(true);
    expect(homeActions.some((action) => action.id === "action-alert-next")).toBe(false);
  });
});
