import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

import { ArchitectureDraftsHelpEvidenceOrientationStrip } from "@/components/help/ArchitectureDraftsHelpEvidenceOrientationStrip";
import { ARCHITECTURE_DRAFTS_HELP_SOURCES } from "@/lib/architecture-drafts-help-evidence-copy";

describe("ArchitectureDraftsHelpEvidenceOrientationStrip", () => {
  it("renders Where to go next follow-ups without a duplicate claim-discipline band", () => {
    const sourceHrefs = ARCHITECTURE_DRAFTS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);

    render(<ArchitectureDraftsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-architecture-drafts-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("help-architecture-drafts-claim-discipline")).toBeNull();
    expectWhereToGoNextFollowUpLinks(screen, ARCHITECTURE_DRAFTS_HELP_SOURCES);
  });
});
