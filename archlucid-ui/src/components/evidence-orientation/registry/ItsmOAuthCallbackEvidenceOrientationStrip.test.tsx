import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

import { ItsmOAuthCallbackEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-integration-strips";
import { ITSM_OAUTH_CALLBACK_SOURCES } from "@/lib/itsm/itsm-oauth-callback-evidence-copy";

describe("ItsmOAuthCallbackEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups when header carries claim discipline", () => {
    render(<ItsmOAuthCallbackEvidenceOrientationStrip />);

    expect(screen.getByTestId("itsm-oauth-callback-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("itsm-oauth-callback-claim-discipline")).toBeNull();

    expectWhereToGoNextFollowUpLinks(screen, ITSM_OAUTH_CALLBACK_SOURCES);
  });
});
