import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SponsorShellOrientationCallout } from "./SponsorShellOrientationCallout";

describe("SponsorShellOrientationCallout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows orientation copy until dismissed", () => {
    render(<SponsorShellOrientationCallout />);

    expect(screen.getByTestId("sponsor-shell-orientation-callout")).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByTestId("sponsor-shell-orientation-callout")).toBeNull();
  });
});
