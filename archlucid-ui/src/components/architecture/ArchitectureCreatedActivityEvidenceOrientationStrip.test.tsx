import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedActivityEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedActivityEvidenceOrientationStrip";
import {
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE,
  RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO,
} from "@/lib/run-detail-activity-sources";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ArchitectureCreatedActivityEvidenceOrientationStrip", () => {
  it("renders help, Sources, and claim-discipline for create-home Activity", () => {
    render(<ArchitectureCreatedActivityEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-created-activity-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-activity-sources")).toHaveTextContent(
      RUN_DETAIL_ACTIVITY_PRE_COMMIT_SOURCES_INTRO,
    );
    expect(screen.getByTestId("architecture-created-activity-claim-discipline")).toHaveTextContent(
      RUN_DETAIL_ACTIVITY_PRE_COMMIT_CLAIM_DISCIPLINE,
    );
  });
});
