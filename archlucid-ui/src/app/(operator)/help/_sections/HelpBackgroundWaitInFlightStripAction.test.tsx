import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-shell-in-flight-operations", () => ({
  useShellInFlightOperations: () => [],
}));

vi.mock("@/lib/operations/open-shell-in-flight-event", () => ({
  requestOpenShellInFlightOperations: vi.fn(),
}));

import { HelpBackgroundWaitInFlightStripAction } from "@/app/(operator)/help/_sections/HelpBackgroundWaitInFlightStripAction";
import { requestOpenShellInFlightOperations } from "@/lib/operations/open-shell-in-flight-event";

describe("HelpBackgroundWaitInFlightStripAction (DW-015)", () => {
  it("shows None in progress and opens the shell strip on click", () => {
    render(<HelpBackgroundWaitInFlightStripAction ariaKeyShortcuts="alt+shift+i" />);

    expect(screen.getByTestId("help-background-wait-in-flight-strip-action")).toHaveTextContent(
      "None in progress",
    );
    expect(screen.getByTestId("help-background-wait-open-in-flight-strip")).toHaveAttribute(
      "aria-keyshortcuts",
      "alt+shift+i",
    );

    screen.getByTestId("help-background-wait-open-in-flight-strip").click();

    expect(requestOpenShellInFlightOperations).toHaveBeenCalled();
  });
});
