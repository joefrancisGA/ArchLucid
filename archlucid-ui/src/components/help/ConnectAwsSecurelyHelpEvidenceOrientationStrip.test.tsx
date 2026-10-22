import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/cloud-connections/aws",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { ConnectAwsSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAwsSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_AWS_SECURELY_SOURCES,
} from "@/lib/connect-aws-securely-help-evidence-copy";

describe("ConnectAwsSecurelyHelpEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups because claim discipline lives on the header info strip", () => {
    render(<ConnectAwsSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-aws-securely-help-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("connect-aws-securely-help-claim-discipline")).not.toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(screen, CONNECT_AWS_SECURELY_SOURCES, "/help/cloud-connections/aws");
  });
});
