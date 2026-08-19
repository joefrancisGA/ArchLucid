import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyArchLucidClaimOrientationStrip } from "./WhyArchLucidClaimOrientationStrip";
import {
  WHY_ARCHLUCID_CLAIM_DISCIPLINE,
  WHY_ARCHLUCID_CLAIM_HEADING,
  WHY_ARCHLUCID_SOURCES_INTRO,
} from "@/lib/why-archlucid-evidence-copy";

describe("WhyArchLucidClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for pilot proof telemetry", () => {
    render(<WhyArchLucidClaimOrientationStrip />);

    expect(screen.getByTestId("why-archlucid-orientation")).toBeInTheDocument();
    expect(screen.getByText(WHY_ARCHLUCID_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(WHY_ARCHLUCID_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(WHY_ARCHLUCID_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("why-archlucid-sources")).toBeInTheDocument();
  });
});
