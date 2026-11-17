import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/help/caiq-sig-response",
  useRouter: (): { push: () => void; replace: () => void } => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WhereToGoNextPreferenceProvider")>();

  return {
    ...actual,
    useWhereToGoNextVisible: () => true,
  };
});
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
  expectFollowUpLink,
} from "@/lib/claim-discipline-test-helpers";

import { CaiqSigResponseHelpEvidenceOrientationStrip } from "@/components/help/CaiqSigResponseHelpEvidenceOrientationStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
  CAIQ_SIG_RESPONSE_HELP_LEAD,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
} from "@/lib/caiq-sig-response-help-evidence-copy";

describe("CaiqSigResponseHelpEvidenceOrientationStrip", () => {
  it("renders lead strip, diligence links with when clauses, and no duplicate claim discipline", () => {
    render(<CaiqSigResponseHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("caiq-sig-response-help-lead")).toHaveTextContent(CAIQ_SIG_RESPONSE_HELP_LEAD);
    expectClaimDisciplineHeading(
      screen,
      "help-caiq-sig-response",
      CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
      "caiq-sig-response-help-claim-heading",
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-caiq-sig-response",
      "caiq-sig-response-help-claim-discipline",
      CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
    );

    const sourcesRegion = within(screen.getByTestId("caiq-sig-response-help-sources"));

    for (const link of CAIQ_SIG_RESPONSE_HELP_SOURCES) {
      expectFollowUpLink(sourcesRegion, link);
      expect(sourcesRegion.getByText(link.when)).toBeInTheDocument();
    }
  });
});
