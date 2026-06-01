import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PilotStartHereStrip } from "@/components/operator-home/PilotStartHereStrip";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";

afterEach(() => {
  localStorage.clear();
});

describe("first-review cognitive load guard", () => {
  it("exposes exactly four primary steps before advanced lanes", () => {
    localStorage.setItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere, "0");

    render(<PilotStartHereStrip />);

    expect(screen.getByTestId("pilot-start-here-strip")).toBeInTheDocument();

    const primaryStepList = screen.getByTestId("pilot-start-here-strip").querySelector("ol");
    expect(primaryStepList).not.toBeNull();
    expect(within(primaryStepList as HTMLElement).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByTestId("pilot-start-platform")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-start-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-start-run")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-start-proof")).toBeInTheDocument();
  });

  it("keeps Operate and V1.1 connectors secondary in helper copy", () => {
    localStorage.setItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere, "0");

    render(<PilotStartHereStrip />);

    const copy = screen.getByTestId("pilot-start-here-strip").textContent ?? "";
    expect(copy).toContain("V1.1 connectors");
    expect(copy).toContain("optional");
  });

  it("starts collapsed by default and expands from the chevron", async () => {
    render(<PilotStartHereStrip />);

    expect(screen.queryByTestId("pilot-start-platform")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand Fast path to first review package" }));

    await waitFor(() => {
      expect(screen.getByTestId("pilot-start-platform")).toBeInTheDocument();
    });
  });
});
