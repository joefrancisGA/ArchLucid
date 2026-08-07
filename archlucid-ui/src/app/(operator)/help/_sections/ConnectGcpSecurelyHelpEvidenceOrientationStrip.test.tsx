import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectGcpSecurelyHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ConnectGcpSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_GCP_SECURELY_CANONICAL_PATH,
  CONNECT_GCP_SECURELY_SOURCES,
} from "@/lib/connect-gcp-securely-help-evidence-copy";

describe("ConnectGcpSecurelyHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking gcp cloud-connections help", () => {
    render(<ConnectGcpSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-gcp-securely-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("connect-gcp-securely-help-claim-discipline")).toBeInTheDocument();

    for (const link of CONNECT_GCP_SECURELY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      CONNECT_GCP_SECURELY_SOURCES.some((link) => link.href === CONNECT_GCP_SECURELY_CANONICAL_PATH),
    ).toBe(false);
  });
});
