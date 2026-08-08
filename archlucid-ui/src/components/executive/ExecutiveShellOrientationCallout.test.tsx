import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ExecutiveShellOrientationCallout } from "./ExecutiveShellOrientationCallout";

describe("ExecutiveShellOrientationCallout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows orientation copy until dismissed", () => {
    render(<ExecutiveShellOrientationCallout />);

    expect(screen.queryByTestId("executive-shell-orientation-callout")).toBeNull(); // TB-2092
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByTestId("executive-shell-orientation-callout")).toBeNull();
  });
});
