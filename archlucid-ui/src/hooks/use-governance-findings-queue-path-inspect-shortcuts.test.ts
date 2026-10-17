import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  focusGovernanceFindingsQueuePathInspectPanel,
  useGovernanceFindingsQueuePathInspectShortcuts,
} from "@/hooks/use-governance-findings-queue-path-inspect-shortcuts";
import { COMMAND_PALETTE_GOVERNANCE_FINDINGS_PATH_INSPECT_EVENT } from "@/lib/governance/governance-findings-queue-command-palette-events";

const keyboardHandlers = vi.hoisted(() => ({
  map: {} as Record<string, { handler: () => void }>,
}));

vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: (map: Record<string, { handler: () => void }>) => {
    keyboardHandlers.map = map;
  },
}));

describe("useGovernanceFindingsQueuePathInspectShortcuts", () => {
  afterEach(() => {
    keyboardHandlers.map = {};
  });

  it("registers alt+i when enabled", () => {
    const onFocusPathInspect = vi.fn();

    renderHook(() =>
      useGovernanceFindingsQueuePathInspectShortcuts({
        enabled: true,
        onFocusPathInspect,
      }),
    );

    keyboardHandlers.map["alt+i"]?.handler();
    expect(onFocusPathInspect).toHaveBeenCalledTimes(1);
  });

  it("does not register shortcuts when disabled", () => {
    renderHook(() =>
      useGovernanceFindingsQueuePathInspectShortcuts({
        enabled: false,
        onFocusPathInspect: vi.fn(),
      }),
    );

    expect(keyboardHandlers.map["alt+i"]).toBeUndefined();
  });

  it("listens for the command palette inspect event", () => {
    const onFocusPathInspect = vi.fn();

    renderHook(() =>
      useGovernanceFindingsQueuePathInspectShortcuts({
        enabled: true,
        onFocusPathInspect,
      }),
    );

    window.dispatchEvent(new Event(COMMAND_PALETTE_GOVERNANCE_FINDINGS_PATH_INSPECT_EVENT));
    expect(onFocusPathInspect).toHaveBeenCalledTimes(1);
  });
});

describe("focusGovernanceFindingsQueuePathInspectPanel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolls and focuses the panel element", () => {
    const panel = document.createElement("section");
    panel.tabIndex = -1;
    panel.scrollIntoView = vi.fn();
    panel.focus = vi.fn();
    document.body.appendChild(panel);

    focusGovernanceFindingsQueuePathInspectPanel(panel);

    expect(panel.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(panel.focus).toHaveBeenCalled();
  });
});
