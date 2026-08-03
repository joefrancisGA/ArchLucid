import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApprovalLineageEvidenceOrientationStrip } from "@/app/(operator)/governance/approval-requests/[id]/lineage/_sections/ApprovalLineageEvidenceOrientationStrip";
import {
  APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN,
  APPROVAL_LINEAGE_SOURCES,
} from "@/lib/approval-lineage-evidence-copy";

describe("ApprovalLineageEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the lineage path pattern", () => {
    render(<ApprovalLineageEvidenceOrientationStrip />);

    expect(screen.getByTestId("approval-lineage-sources")).toBeInTheDocument();
    expect(screen.getByTestId("approval-lineage-claim-discipline")).toBeInTheDocument();

    for (const link of APPROVAL_LINEAGE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      APPROVAL_LINEAGE_SOURCES.some((link) => link.href === APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN),
    ).toBe(false);
  });
});
