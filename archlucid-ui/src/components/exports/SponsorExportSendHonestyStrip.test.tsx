import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  resolveSponsorExportSendHonestyEntries,
  SponsorExportSendHonestyStrip,
} from "@/components/exports/SponsorExportSendHonestyStrip";
import { FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY } from "@/lib/buyer/buyer-polish-copy";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";

const useProductLineMock = vi.hoisted(() => vi.fn(() => ({ productLine: "architecture" as const })));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => useProductLineMock(),
}));

describe("SponsorExportSendHonestyStrip", () => {
  it("omits sponsor ROI headline math on SecureNow (generic and UHG shells)", () => {
    const secureNowEntries = resolveSponsorExportSendHonestyEntries("security");

    expect(secureNowEntries.map((entry) => entry.testIdSuffix)).toEqual(["disposition", "policy-influence"]);
    expect(secureNowEntries.some((entry) => entry.line === SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE)).toBe(false);
  });

  it("renders combined export literacy as a checklist without the policy chip", () => {
    useProductLineMock.mockReturnValue({ productLine: "architecture" });

    render(<SponsorExportSendHonestyStrip testIdPrefix="infra-diagrams-export" />);

    const strip = screen.getByTestId("infra-diagrams-export-honesty-strip");

    expect(strip).toBeInTheDocument();
    expect(strip).toHaveAttribute("role", "note");
    expect(strip.querySelector("ul")).not.toBeNull();
    expect(strip.querySelector("ul")).not.toHaveAttribute("role");
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

  it("hides the portfolio headline savings line on SecureNow diagram exports", () => {
    useProductLineMock.mockReturnValue({ productLine: "security" });

    render(<SponsorExportSendHonestyStrip testIdPrefix="infra-diagrams-export" />);

    expect(screen.queryByTestId("infra-diagrams-export-non-summing")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-diagrams-export-disposition")).toHaveTextContent(
      FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY,
    );
    expect(screen.getByTestId("infra-diagrams-export-policy-influence")).toHaveTextContent(
      POLICY_PACK_INFLUENCE_HONESTY_LINE,
    );
  });
});
