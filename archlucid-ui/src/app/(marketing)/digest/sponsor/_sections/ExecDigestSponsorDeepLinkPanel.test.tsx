import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DIGEST_SPONSOR_LEAD,
  DIGEST_SPONSOR_OVERVIEW_TITLE,
  DIGEST_SPONSOR_PRIMARY_CONTENT_ID,
  DIGEST_SPONSOR_SIGN_IN_WORKSPACE_LABEL,
  DIGEST_SPONSOR_SKIP_LINK_LABEL,
} from "@/lib/marketing/digest-sponsor-page-copy";
import type { ExecDigestSponsorDeepLinkView } from "@/lib/digest/exec-digest-sponsor-deep-link-server";

import { ExecDigestSponsorDeepLinkPanel } from "./ExecDigestSponsorDeepLinkPanel";

const view: ExecDigestSponsorDeepLinkView = {
  target: "dashboard",
  weekLabel: "Week of Aug 10, 2026",
  committedManifestsInWeek: 2,
  topRuns: [
    {
      runIdHex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      significanceScore: 91,
      caption: "Payments edge",
    },
  ],
  findingsDeltaSummary: "3 new findings this week.",
  signInUrl: "/auth/signin",
};

describe("ExecDigestSponsorDeepLinkPanel", () => {
  it("renders skip link, orientation above digest body, and buyer lead copy", () => {
    render(<ExecDigestSponsorDeepLinkPanel view={view} />);

    expect(screen.getByRole("link", { name: DIGEST_SPONSOR_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DIGEST_SPONSOR_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("digest-sponsor-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("digest-sponsor-orientation")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: DIGEST_SPONSOR_OVERVIEW_TITLE })).toBeInTheDocument();
    expect(screen.getByText(DIGEST_SPONSOR_LEAD)).toBeInTheDocument();
    expect(screen.getByText("Payments edge")).toBeInTheDocument();
  });

  it("sign-in link includes returnUrl to sponsor digest after authentication", () => {
    render(<ExecDigestSponsorDeepLinkPanel view={view} />);

    expect(screen.getByRole("link", { name: DIGEST_SPONSOR_SIGN_IN_WORKSPACE_LABEL })).toHaveAttribute(
      "href",
      "/auth/signin?returnUrl=%2Fdigest%2Fsponsor",
    );
  });
});
