import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFindingCardShortcuts } from "./useFindingCardShortcuts";

describe("useFindingCardShortcuts", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  function appendFindingCard(findingId: string): HTMLDivElement {
    const div = document.createElement("div");
    div.setAttribute("data-finding-id", findingId);
    div.setAttribute("tabindex", "0");
    div.setAttribute("role", "article");
    document.body.appendChild(div);

    return div;
  }

  it("does not call onAction for Alt+1 when mutationsEnabled is false", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction, mutationsEnabled: false }));

    const card = appendFindingCard("abc");
    card.focus();

    fireEvent.keyDown(window, { key: "1", altKey: true });

    expect(onAction).not.toHaveBeenCalled();
  });

  it("calls onAction with Accepted when Alt+1 is pressed and a card with data-finding-id is focused", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction }));

    const card = appendFindingCard("abc");
    card.focus();

    fireEvent.keyDown(window, { key: "1", altKey: true });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("abc", "Accepted");
  });

  it("calls onAction with Remediated when Alt+2 is pressed", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction }));

    const card = appendFindingCard("abc");
    card.focus();

    fireEvent.keyDown(window, { key: "2", altKey: true });

    expect(onAction).toHaveBeenCalledWith("abc", "Remediated");
  });

  it("calls onAction with RejectedAsNotApplicable when Alt+3 is pressed", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction }));

    const card = appendFindingCard("abc");
    card.focus();

    fireEvent.keyDown(window, { key: "3", altKey: true });

    expect(onAction).toHaveBeenCalledWith("abc", "RejectedAsNotApplicable");
  });

  it("does not call onAction for Alt+1 when no finding card is focused", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction }));

    const unrelated = document.createElement("div");
    unrelated.setAttribute("tabindex", "0");
    document.body.appendChild(unrelated);
    unrelated.focus();

    fireEvent.keyDown(window, { key: "1", altKey: true });

    expect(onAction).not.toHaveBeenCalled();
  });

  it("moves focus to the next [data-finding-id] element on Alt+J", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction }));

    const first = appendFindingCard("a");
    const second = appendFindingCard("b");
    first.focus();

    fireEvent.keyDown(window, { key: "j", altKey: true });

    expect(document.activeElement).toBe(second);
  });

  it("keeps focus on the first card when Alt+K is pressed on the first card", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction }));

    const first = appendFindingCard("a");
    appendFindingCard("b");
    first.focus();

    fireEvent.keyDown(window, { key: "k", altKey: true });

    expect(document.activeElement).toBe(first);
  });

  it("moves focus to the previous card on Alt+K when not on the first card", () => {
    const onAction = vi.fn();

    renderHook(() => useFindingCardShortcuts({ onAction }));

    const first = appendFindingCard("a");
    const second = appendFindingCard("b");
    second.focus();

    fireEvent.keyDown(window, { key: "k", altKey: true });

    expect(document.activeElement).toBe(first);
  });
});