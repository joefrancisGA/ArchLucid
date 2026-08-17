import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DIGEST_SPONSOR_MISSING_TOKEN_BODY } from "@/lib/marketing/digest-sponsor-page-copy";

import { ExecDigestSponsorMissingTokenPage } from "./ExecDigestSponsorDeepLinkIssuePage";

describe("ExecDigestSponsorMissingTokenPage", () => {
  it("renders skip link and evaluation orientation on issue shell", () => {
    render(<ExecDigestSponsorMissingTokenPage />);

    expect(screen.getByTestId("digest-sponsor-issue-page")).toBeInTheDocument();
    expect(screen.getByTestId("digest-sponsor-orientation-top")).toBeInTheDocument();
    expect(screen.getByText(DIGEST_SPONSOR_MISSING_TOKEN_BODY)).toBeInTheDocument();
  });
});
