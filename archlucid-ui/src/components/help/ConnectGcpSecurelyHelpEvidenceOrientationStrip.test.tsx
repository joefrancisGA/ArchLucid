import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/cloud-connections/gcp",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { ConnectGcpSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectGcpSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING,
  CONNECT_GCP_SECURELY_SOURCES,
} from "@/lib/connect-gcp-securely-help-evidence-copy";

describe("ConnectGcpSecurelyHelpEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups because claim discipline lives on the header info strip", () => {
    render(<ConnectGcpSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-gcp-securely-help-orientation")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING })).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-gcp-securely-help-claim-discipline")).not.toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(screen, CONNECT_GCP_SECURELY_SOURCES, "/help/cloud-connections/gcp");
  });
});
