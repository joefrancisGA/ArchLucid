import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFindingCardShortcuts } from "@/hooks/useFindingCardShortcuts";
import { parseKeyCombo } from "@/hooks/useKeyboardShortcuts";

const CARD_IDS = ["finding-alpha", "finding-bravo", "finding-charlie"];

function fireCombo(combo: string, target: Window | Element = window): void {
  const parsed = parseKeyCombo(combo);

  fireEvent.keyDown(target, {
    key: parsed.key,
    altKey: parsed.alt,
    ctrlKey: parsed.ctrl,
    metaKey: parsed.meta,
    shiftKey: parsed.shift,
    bubbles: true,
  });
}

function FindingsShortcutHarness({
  ids,
  onAction,
}: {
  ids: string[];
  onAction: (findingId: string, disposition: string) => void;
}) {
  useFindingCardShortcuts({ onAction });

  return (
    <div>
      {ids.map((id) => (
        <div key={id} data-finding-id={id} data-testid={`finding-card-${id}`} role="article" tabIndex={0} />
      ))}
      <div data-testid="outside-finding-cards" tabIndex={0}>
        Outside cards
      </div>
      <input data-testid="finding-shortcut-input" defaultValue="" />
    </div>
  );
}

describe("keyboard shortcuts findings page (integration)", () => {
  const onAction = vi.fn();

  beforeEach(() => {
    onAction.mockClear();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("calls onAction with Accepted when Alt+1 is pressed on the focused card", () => {
    render(<FindingsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    screen.getByTestId(`finding-card-${CARD_IDS[0]}`).focus();
    fireCombo("alt+1");

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(CARD_IDS[0], "Accepted");
  });

  it("moves focus with Alt+J and Alt+K and remediates the focused card", () => {
    render(<FindingsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    const first = screen.getByTestId(`finding-card-${CARD_IDS[0]}`);
    const second = screen.getByTestId(`finding-card-${CARD_IDS[1]}`);

    first.focus();
    onAction.mockClear();
    fireCombo("alt+j");

    expect(document.activeElement).toBe(second);

    onAction.mockClear();
    fireCombo("alt+2");

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(CARD_IDS[1], "Remediated");

    onAction.mockClear();
    fireCombo("alt+k");

    expect(document.activeElement).toBe(first);
  });

  it("does not call onAction when no finding card is focused", () => {
    render(<FindingsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    screen.getByTestId("outside-finding-cards").focus();
    fireCombo("alt+1");

    expect(onAction).not.toHaveBeenCalled();
  });

  it("keeps focus on the first card when Alt+K is pressed there", () => {
    render(<FindingsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    const first = screen.getByTestId(`finding-card-${CARD_IDS[0]}`);
    first.focus();
    fireCombo("alt+k");

    expect(document.activeElement).toBe(first);
  });

  it("does not steal Alt+1 when focus is in an input", () => {
    render(<FindingsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    screen.getByTestId(`finding-card-${CARD_IDS[0]}`).focus();
    const input = screen.getByTestId("finding-shortcut-input");
    input.focus();
    fireCombo("alt+1", input);

    expect(onAction).not.toHaveBeenCalled();
  });
});