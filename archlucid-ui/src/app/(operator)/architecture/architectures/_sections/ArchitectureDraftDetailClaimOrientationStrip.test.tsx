import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE } from "@/lib/architectures-draft-evidence-copy";
import { ArchitectureDraftDetailClaimOrientationStrip } from "./ArchitectureDraftDetailClaimOrientationStrip";

describe("ArchitectureDraftDetailClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<ArchitectureDraftDetailClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-detail-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
