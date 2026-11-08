import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    usePathname: () => "/help/integration-readiness",
  });
});
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

import { IntegrationReadinessHelpEvidenceOrientationStrip } from "@/components/help/IntegrationReadinessHelpEvidenceOrientationStrip";
import {
  INTEGRATION_READINESS_HELP_CANONICAL_PATH,
  INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";

describe("IntegrationReadinessHelpEvidenceOrientationStrip", () => {
  it("renders connector follow-up links without duplicate claim discipline when omitted", () => {
    render(<IntegrationReadinessHelpEvidenceOrientationStrip />);

    expect(screen.queryByTestId("integration-readiness-help-claim-discipline")).not.toBeInTheDocument();
    expectWhereToGoNextFollowUpLinks(
      screen,
      INTEGRATION_READINESS_HELP_SOURCES,
      INTEGRATION_READINESS_HELP_CANONICAL_PATH,
    );
  });
});
