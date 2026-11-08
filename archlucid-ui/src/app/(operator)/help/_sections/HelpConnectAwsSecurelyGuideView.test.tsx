import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpConnectAwsSecurelyGuideView } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyGuideView";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/connect-aws-securely-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpConnectAwsSecurelyGuideView claim discipline TOC", () => {
  const entry = getProductDocumentationEntry("cloud-connections-aws");

  it("omits orphan claim-discipline TOC link while header strip owns the band", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections-aws documentation entry.");
    }

    render(<HelpConnectAwsSecurelyGuideView entry={entry} />);

    expect(screen.getByTestId("help-connect-aws-securely-claim-discipline-strip")).toHaveTextContent(
      CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).queryByRole("link", { name: CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING }),
    ).not.toBeInTheDocument();
  });
});
