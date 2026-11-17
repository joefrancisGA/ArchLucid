import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/integrations/itsm/oauth/callback",
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  };
});

import { ItsmOAuthCallbackEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-integration-strips";
import {
  ITSM_OAUTH_CALLBACK_CANONICAL_PATH,
  ITSM_OAUTH_CALLBACK_SOURCES,
} from "@/lib/itsm/itsm-oauth-callback-evidence-copy";

describe("ItsmOAuthCallbackEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups when header carries claim discipline", () => {
    render(<ItsmOAuthCallbackEvidenceOrientationStrip />);

    expect(screen.getByTestId("itsm-oauth-callback-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("itsm-oauth-callback-claim-discipline")).toBeNull();

    expectWhereToGoNextFollowUpLinks(
      screen,
      ITSM_OAUTH_CALLBACK_SOURCES,
      ITSM_OAUTH_CALLBACK_CANONICAL_PATH,
    );
  });
});
