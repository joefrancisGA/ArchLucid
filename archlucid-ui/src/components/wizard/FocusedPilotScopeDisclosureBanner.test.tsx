import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FocusedPilotScopeDisclosureBanner } from "@/components/wizard/FocusedPilotScopeDisclosureBanner";
import { REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION } from "@/lib/focused-pilot-mode-policy-packs";

describe("FocusedPilotScopeDisclosureBanner", () => {
  it("shows workspace disambiguation and focused standards when enabled", () => {
    render(<FocusedPilotScopeDisclosureBanner focusedModeEnabled={true} />);

    expect(screen.getByTestId("focused-pilot-scope-disclosure-banner")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION)).toBeInTheDocument();
    expect(screen.getByText(/Focused review scope:/)).toBeInTheDocument();
    expect(screen.getByText(/Security Architecture Baseline/)).toBeInTheDocument();
  });

  it("shows expanded scope copy when focused mode is off", () => {
    render(<FocusedPilotScopeDisclosureBanner focusedModeEnabled={false} />);

    expect(screen.getByText(/Expanded review scope:/)).toBeInTheDocument();
  });
});
