import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorChromeModeProvider } from "@/components/operator/OperatorChromeModeContext";
import { RunDetailMinimalChromeMount } from "@/components/runs/RunDetailMinimalChromeMount";

describe("RunDetailMinimalChromeMount", () => {
  it("renders children inside chrome provider", () => {
    render(
      <OperatorChromeModeProvider>
        <RunDetailMinimalChromeMount>
          <p>Fatal review message</p>
        </RunDetailMinimalChromeMount>
      </OperatorChromeModeProvider>,
    );

    expect(screen.getByText("Fatal review message")).toBeInTheDocument();
  });
});
