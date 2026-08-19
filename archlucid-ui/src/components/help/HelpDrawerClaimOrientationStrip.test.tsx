import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpDrawerClaimOrientationStrip } from "./HelpDrawerClaimOrientationStrip";
import {
  CONTEXTUAL_HELP_DRAWER_CLAIM_DISCIPLINE,
  CONTEXTUAL_HELP_DRAWER_CLAIM_HEADING,
  CONTEXTUAL_HELP_DRAWER_SOURCES_INTRO,
} from "@/lib/contextual-help-drawer-evidence-copy";

describe("HelpDrawerClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for the contextual help drawer", () => {
    render(<HelpDrawerClaimOrientationStrip />);

    expect(screen.getByTestId("contextual-help-drawer-orientation")).toBeInTheDocument();
    expect(screen.getByText(CONTEXTUAL_HELP_DRAWER_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(CONTEXTUAL_HELP_DRAWER_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(CONTEXTUAL_HELP_DRAWER_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("contextual-help-drawer-sources")).toBeInTheDocument();
  });
});
