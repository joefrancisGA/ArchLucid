import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAlertCardShortcuts } from "@/hooks/useAlertCardShortcuts";
import { parseKeyCombo } from "@/hooks/useKeyboardShortcuts";

const CARD_IDS = ["alert-alpha", "alert-bravo", "alert-charlie"];

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

function AlertsShortcutHarness({
  ids,
  onAction,
}: {
  ids: string[];
  onAction: (alertId: string, action: string) => void;
}) {
  useAlertCardShortcuts({ onAction });

  return (
    <div>
      {ids.map((id) => (
        <div key={id} data-alert-id={id} data-testid={`alert-card-${id}`} role="article" tabIndex={0} />
      ))}
      <div data-testid="outside-alert-cards" tabIndex={0}>
        Outside cards
      </div>
    </div>
  );
}

describe("keyboard shortcuts alerts page (integration)", () => {
  const onAction = vi.fn();

  beforeEach(() => {
    onAction.mockClear();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("calls onAction with Acknowledge when Alt+1 is pressed on the focused card", () => {
    render(<AlertsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    screen.getByTestId(`alert-card-${CARD_IDS[0]}`).focus();
    fireCombo("alt+1");

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(CARD_IDS[0], "Acknowledge");
  });

  it("moves focus with Alt+J and Alt+K and resolves actions on the focused card", () => {
    render(<AlertsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    const first = screen.getByTestId(`alert-card-${CARD_IDS[0]}`);
    const second = screen.getByTestId(`alert-card-${CARD_IDS[1]}`);

    first.focus();
    onAction.mockClear();
    fireCombo("alt+j");

    expect(document.activeElement).toBe(second);

    onAction.mockClear();
    fireCombo("alt+2");

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(CARD_IDS[1], "Resolve");

    onAction.mockClear();
    fireCombo("alt+k");

    expect(document.activeElement).toBe(first);
  });

  it("does not call onAction when no alert card is focused", () => {
    render(<AlertsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    screen.getByTestId("outside-alert-cards").focus();
    fireCombo("alt+1");

    expect(onAction).not.toHaveBeenCalled();
  });

  it("keeps focus on the first card when Alt+K is pressed there", () => {
    render(<AlertsShortcutHarness ids={CARD_IDS} onAction={onAction} />);

    const first = screen.getByTestId(`alert-card-${CARD_IDS[0]}`);
    first.focus();
    fireCombo("alt+k");

    expect(document.activeElement).toBe(first);
  });
});
