import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
import { FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY } from "@/lib/buyer/buyer-polish-copy";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";

describe("SponsorExportSendHonestyStrip", () => {
  it("renders combined export literacy as a checklist without the policy chip", () => {
    render(<SponsorExportSendHonestyStrip testIdPrefix="infra-diagrams-export" />);

    expect(screen.getByTestId("infra-diagrams-export-honesty-strip")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-export-non-summing")).toHaveTextContent(
      SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE,
    );
    expect(screen.getByTestId("infra-diagrams-export-disposition")).toHaveTextContent(
      FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY,
    );
    expect(screen.getByTestId("infra-diagrams-export-policy-influence")).toHaveTextContent(
      POLICY_PACK_INFLUENCE_HONESTY_LINE,
    );
    expect(screen.queryByTestId("policy-pack-influence-honesty-chip")).not.toBeInTheDocument();
  });
});
