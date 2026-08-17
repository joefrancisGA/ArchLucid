import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesNewClaimOrientationStrip } from "./ArchitecturesNewClaimOrientationStrip";
import { ARCHITECTURES_NEW_CLAIM_DISCIPLINE } from "@/lib/architectures-new-evidence-copy";
import { ARCHITECTURES_NEW_CLAIM_HEADING } from "@/lib/architectures-new-page-copy";

describe("ArchitecturesNewClaimOrientationStrip", () => {
  it("renders claim heading and discipline copy", () => {
    render(<ArchitecturesNewClaimOrientationStrip />);

    expect(screen.getByText(ARCHITECTURES_NEW_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURES_NEW_CLAIM_DISCIPLINE)).toBeInTheDocument();
  });
});
