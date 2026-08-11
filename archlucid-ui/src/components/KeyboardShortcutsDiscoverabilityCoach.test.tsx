import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { KeyboardShortcutsDiscoverabilityCoach } from "@/components/KeyboardShortcutsDiscoverabilityCoach";
import {
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY,
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_HEADING,
  KEYBOARD_SHORTCUTS_DISCOVERABILITY_LEAD,
} from "@/lib/keyboard-shortcuts-discoverability";

describe("KeyboardShortcutsDiscoverabilityCoach (TB-2268)", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders help/palette/where hints when not dismissed", async () => {
    render(<KeyboardShortcutsDiscoverabilityCoach />);

    await waitFor(() => {
      expect(screen.getByTestId("keyboard-shortcuts-discoverability-coach")).toBeInTheDocument();
    });

    expect(screen.getByText(KEYBOARD_SHORTCUTS_DISCOVERABILITY_HEADING)).toBeInTheDocument();
    expect(screen.getByText(KEYBOARD_SHORTCUTS_DISCOVERABILITY_LEAD)).toBeInTheDocument();
    expect(
      screen.getByTestId("keyboard-shortcuts-discoverability-coach-hint-help"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("keyboard-shortcuts-discoverability-coach-hint-palette"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("keyboard-shortcuts-discoverability-coach-hint-where"),
    ).toBeInTheDocument();
  });

  it("dismisses and persists to localStorage", async () => {
    render(<KeyboardShortcutsDiscoverabilityCoach />);

    await waitFor(() => {
      expect(
        screen.getByTestId("keyboard-shortcuts-discoverability-coach-dismiss"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("keyboard-shortcuts-discoverability-coach-dismiss"));

    expect(
      screen.queryByTestId("keyboard-shortcuts-discoverability-coach"),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY)).toBe(
      "1",
    );
  });

  it("does not render when already dismissed", async () => {
    window.localStorage.setItem(KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY, "1");

    render(<KeyboardShortcutsDiscoverabilityCoach />);

    await waitFor(() => {
      expect(
        screen.queryByTestId("keyboard-shortcuts-discoverability-coach"),
      ).not.toBeInTheDocument();
    });
  });
});
