import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectAzureSecurelyEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ConnectAzureSecurelyEvidenceOrientationStrip";
import {
  CONNECT_AZURE_SECURELY_CANONICAL_PATH,
  CONNECT_AZURE_SECURELY_SOURCES,
} from "@/lib/connect-azure-securely-evidence-copy";

describe("ConnectAzureSecurelyEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the Azure help path", () => {
    render(<ConnectAzureSecurelyEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-azure-securely-sources")).toBeInTheDocument();
    expect(screen.getByTestId("connect-azure-securely-claim-discipline")).toBeInTheDocument();

    for (const link of CONNECT_AZURE_SECURELY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      CONNECT_AZURE_SECURELY_SOURCES.some((link) => link.href === CONNECT_AZURE_SECURELY_CANONICAL_PATH),
    ).toBe(false);
  });
});
