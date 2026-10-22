import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAlertCardShortcuts } from "./useAlertCardShortcuts";

describe("useAlertCardShortcuts", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  function appendAlertCard(alertId: string): HTMLDivElement {
    const div = document.createElement("div");
    div.setAttribute("data-alert-id", alertId);
    div.setAttribute("tabindex", "0");
    div.setAttribute("role", "article");
    document.body.appendChild(div);

    return div;
  }

  it("does not call onAction for Alt+1 when mutationsEnabled is false", () => {
    const onAction = vi.fn();

    renderHook(() => useAlertCardShortcuts({ onAction, mutationsEnabled: false }));

    const card = appendAlertCard("abc");
    card.focus();

    fireEvent.keyDown(window, { key: "1", altKey: true });

    expect(onAction).not.toHaveBeenCalled();
  });

  it("calls onAction with Acknowledge when Alt+1 is pressed and a card with data-alert-id is focused", () => {
    const onAction = vi.fn();

    renderHook(() => useAlertCardShortcuts({ onAction }));

    const card = appendAlertCard("abc");
    card.focus();

    fireEvent.keyDown(window, { key: "1", altKey: true });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("abc", "Acknowledge");
  });

  it("does not call onAction for Alt+1 when no alert card is focused", () => {
    const onAction = vi.fn();

    renderHook(() => useAlertCardShortcuts({ onAction }));

    const unrelated = document.createElement("div");
    unrelated.setAttribute("tabindex", "0");
    document.body.appendChild(unrelated);
    unrelated.focus();

    fireEvent.keyDown(window, { key: "1", altKey: true });

    expect(onAction).not.toHaveBeenCalled();
  });

  it("moves focus to the next [data-alert-id] element on Alt+J", () => {
    const onAction = vi.fn();

    renderHook(() => useAlertCardShortcuts({ onAction }));

    const first = appendAlertCard("a");
    const second = appendAlertCard("b");
    first.focus();

    fireEvent.keyDown(window, { key: "j", altKey: true });

    expect(document.activeElement).toBe(second);
  });

  it("keeps focus on the first card when Alt+K is pressed on the first card", () => {
    const onAction = vi.fn();

    renderHook(() => useAlertCardShortcuts({ onAction }));

    const first = appendAlertCard("a");
    appendAlertCard("b");
    first.focus();

    fireEvent.keyDown(window, { key: "k", altKey: true });

    expect(document.activeElement).toBe(first);
  });

  it("moves focus to the previous card on Alt+K when not on the first card", () => {
    const onAction = vi.fn();

    renderHook(() => useAlertCardShortcuts({ onAction }));

    const first = appendAlertCard("a");
    const second = appendAlertCard("b");
    second.focus();

    fireEvent.keyDown(window, { key: "k", altKey: true });

    expect(document.activeElement).toBe(first);
  });
});
