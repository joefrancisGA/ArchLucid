import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("invokes the handler when Alt+N is pressed", () => {
    const handler = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        "alt+n": { handler, description: "New run" },
      }),
    );

    fireEvent.keyDown(window, { key: "n", altKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not invoke the handler for Alt+N when focus is in an input", () => {
    const handler = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        "alt+n": { handler, description: "New run" },
      }),
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: "n", altKey: true, bubbles: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler in an input when allowInInput is true", () => {
    const handler = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        "alt+n": { handler, description: "New run", allowInInput: true },
      }),
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: "n", altKey: true, bubbles: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("invokes the help handler for Shift+?", () => {
    const handler = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        "shift+?": { handler, description: "Help" },
      }),
    );

    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("removes the listener on unmount so handlers no longer run", () => {
    const handler = vi.fn();

    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({
        "alt+n": { handler, description: "New run" },
      }),
    );

    unmount();

    fireEvent.keyDown(window, { key: "n", altKey: true });

    expect(handler).not.toHaveBeenCalled();
  });
});
