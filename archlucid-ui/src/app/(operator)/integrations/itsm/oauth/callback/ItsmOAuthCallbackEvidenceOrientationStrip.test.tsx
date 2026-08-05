import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ItsmOAuthCallbackEvidenceOrientationStrip } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmOAuthCallbackEvidenceOrientationStrip";
import {
  ITSM_OAUTH_CALLBACK_CANONICAL_PATH,
  ITSM_OAUTH_CALLBACK_SOURCES,
} from "@/lib/itsm-oauth-callback-evidence-copy";

describe("ItsmOAuthCallbackEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the OAuth callback", () => {
    render(<ItsmOAuthCallbackEvidenceOrientationStrip />);

    expect(screen.getByTestId("itsm-oauth-callback-sources")).toBeInTheDocument();
    expect(screen.getByTestId("itsm-oauth-callback-claim-discipline")).toBeInTheDocument();

    for (const link of ITSM_OAUTH_CALLBACK_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ITSM_OAUTH_CALLBACK_SOURCES.some((link) => link.href === ITSM_OAUTH_CALLBACK_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
