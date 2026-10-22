import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/cloud-connections/azure",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { ConnectAzureSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAzureSecurelyHelpEvidenceOrientationStrip";
import { CONNECT_AZURE_SECURELY_SOURCES } from "@/lib/connect-azure-securely-help-content";

describe("ConnectAzureSecurelyHelpEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups because claim discipline lives on the header info strip", () => {
    render(<ConnectAzureSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-azure-securely-help-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("connect-azure-securely-help-claim-discipline")).not.toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(screen, CONNECT_AZURE_SECURELY_SOURCES, "/help/cloud-connections/azure");
  });
});
