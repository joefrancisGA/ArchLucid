import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkspaceSwitcherFirstOpenCoach } from "@/components/WorkspaceSwitcherFirstOpenCoach";
import {
  WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY,
  WORKSPACE_SWITCHER_TEACHING_HEADING,
  WORKSPACE_SWITCHER_TEACHING_LEAD,
} from "@/lib/workspace-switcher-teaching";

describe("WorkspaceSwitcherFirstOpenCoach (TB-2234)", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders hierarchy steps when open and not dismissed", async () => {
    render(<WorkspaceSwitcherFirstOpenCoach open />);

    await waitFor(() => {
      expect(screen.getByTestId("workspace-switcher-first-open-coach")).toBeInTheDocument();
    });

    expect(screen.getByText(WORKSPACE_SWITCHER_TEACHING_HEADING)).toBeInTheDocument();
    expect(screen.getByText(WORKSPACE_SWITCHER_TEACHING_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("workspace-switcher-first-open-coach-step-tenant")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-switcher-first-open-coach-step-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-switcher-first-open-coach-step-project")).toBeInTheDocument();
  });

  it("stays hidden when the popover is closed", async () => {
    render(<WorkspaceSwitcherFirstOpenCoach open={false} />);

    await waitFor(() => {
      expect(screen.queryByTestId("workspace-switcher-first-open-coach")).not.toBeInTheDocument();
    });
  });

  it("dismisses and persists to localStorage", async () => {
    render(<WorkspaceSwitcherFirstOpenCoach open />);

    await waitFor(() => {
      expect(screen.getByTestId("workspace-switcher-first-open-coach-dismiss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("workspace-switcher-first-open-coach-dismiss"));

    expect(screen.queryByTestId("workspace-switcher-first-open-coach")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY)).toBe("1");
  });

  it("does not render when already dismissed", async () => {
    window.localStorage.setItem(WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY, "1");

    render(<WorkspaceSwitcherFirstOpenCoach open />);

    await waitFor(() => {
      expect(screen.queryByTestId("workspace-switcher-first-open-coach")).not.toBeInTheDocument();
    });
  });
});
