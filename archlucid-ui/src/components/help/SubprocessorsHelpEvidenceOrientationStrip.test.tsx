import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { SubprocessorsHelpEvidenceOrientationStrip } from "@/components/help/SubprocessorsHelpEvidenceOrientationStrip";
import {
  expectClaimDisciplineBandContent,
} from "@/lib/claim-discipline-test-helpers";
import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_SOURCES,
} from "@/lib/subprocessors-help-evidence-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/subprocessors",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("SubprocessorsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all Sources links", () => {
    render(<SubprocessorsHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBandContent(
      screen,
      "subprocessors-help",
      "subprocessors-help-claim-discipline",
      SUBPROCESSORS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    for (const link of SUBPROCESSORS_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});
