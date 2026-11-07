import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/help/security-trust",
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  };
});

import {
  expectClaimDisciplineBandContent,
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";
import { SecurityTrustHelpEvidenceOrientationStrip } from "@/components/help/SecurityTrustHelpEvidenceOrientationStrip";
import {
  SECURITY_TRUST_HELP_CANONICAL_PATH,
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_SOURCES,
} from "@/lib/security-trust-help-evidence-copy";

describe("SecurityTrustHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all Sources links", () => {
    render(<SecurityTrustHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBandContent(
      screen,
      "security-trust-help",
      "security-trust-help-claim-discipline",
      SECURITY_TRUST_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    expectWhereToGoNextFollowUpLinks(screen, SECURITY_TRUST_HELP_SOURCES, SECURITY_TRUST_HELP_CANONICAL_PATH);
  });
});
