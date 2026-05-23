import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { PILOT_CHECKLIST_PANEL_STORAGE_KEY } from "@/lib/core-pilot-checklist-storage";

describe("CorePilotChecklist", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("renders one checkbox per CORE_PILOT_STEPS entry", async () => {
    render(<CorePilotChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });

    for (const step of CORE_PILOT_STEPS) {
      expect(screen.getByRole("link", { name: step.title })).toBeInTheDocument();
    }

    expect(screen.getAllByRole("checkbox")).toHaveLength(CORE_PILOT_STEPS.length);
  });

  it("persists checkbox state in localStorage under archlucid-pilot-checklist", async () => {
    render(<CorePilotChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });

    const [first] = screen.getAllByRole("checkbox");

    fireEvent.click(first);

    await waitFor(() => {
      const raw = localStorage.getItem(PILOT_CHECKLIST_PANEL_STORAGE_KEY);

      expect(raw).toBeTruthy();

      const parsed = JSON.parse(raw!) as { steps: boolean[]; hidden: boolean };

      expect(parsed.steps[0]).toBe(true);
      expect(parsed.hidden).toBe(false);
    });
  });

  it("shows congratulations when all steps are marked, hides panel, then shows again", async () => {
    localStorage.setItem(
      PILOT_CHECKLIST_PANEL_STORAGE_KEY,
      JSON.stringify({ steps: [true, true, true, true, false], hidden: false }),
    );

    render(<CorePilotChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("checkbox")[CORE_PILOT_STEPS.length - 1]);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist-complete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("core-pilot-checklist-hide"));

    await waitFor(() => {
      expect(screen.queryByTestId("core-pilot-checklist")).toBeNull();
      expect(screen.getByTestId("core-pilot-checklist-collapsed")).toBeInTheDocument();
    });

    expect(JSON.parse(localStorage.getItem(PILOT_CHECKLIST_PANEL_STORAGE_KEY)!).hidden).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /show core pilot checklist/i }));

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-checklist")).toBeInTheDocument();
    });

    expect(JSON.parse(localStorage.getItem(PILOT_CHECKLIST_PANEL_STORAGE_KEY)!).hidden).toBe(false);
  });
});
