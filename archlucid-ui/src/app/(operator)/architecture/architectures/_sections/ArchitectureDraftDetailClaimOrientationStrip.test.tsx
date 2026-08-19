import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDraftDetailClaimOrientationStrip } from "./ArchitectureDraftDetailClaimOrientationStrip";
import { ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING } from "@/lib/architecture/architecture-draft-detail-page-copy";
import {
  ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE,
  ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE,
  ARCHITECTURES_DRAFT_SOURCES_INTRO,
} from "@/lib/architectures-draft-evidence-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";

describe("ArchitectureDraftDetailClaimOrientationStrip", () => {
  it("renders claim heading and discipline copy", () => {
    render(<ArchitectureDraftDetailClaimOrientationStrip />);

    expect(screen.getByText(ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURES_DRAFT_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: ARCHITECTURE_DRAFTS_LIST_LABEL })).not.toBeInTheDocument();
  });
});
