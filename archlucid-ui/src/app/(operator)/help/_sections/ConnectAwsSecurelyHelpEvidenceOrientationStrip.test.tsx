import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectAwsSecurelyHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ConnectAwsSecurelyHelpEvidenceOrientationStrip";
import {
  CONNECT_AWS_SECURELY_CANONICAL_PATH,
  CONNECT_AWS_SECURELY_SOURCES,
} from "@/lib/connect-aws-securely-help-evidence-copy";

describe("ConnectAwsSecurelyHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking aws cloud-connections help", () => {
    render(<ConnectAwsSecurelyHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("connect-aws-securely-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("connect-aws-securely-help-claim-discipline")).toBeInTheDocument();

    for (const link of CONNECT_AWS_SECURELY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      CONNECT_AWS_SECURELY_SOURCES.some((link) => link.href === CONNECT_AWS_SECURELY_CANONICAL_PATH),
    ).toBe(false);
  });
});
