import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DIGEST_SPONSOR_CLAIM_DISCIPLINE,
  DIGEST_SPONSOR_SOURCES,
} from "@/lib/marketing/digest-sponsor-evidence-copy";
import {
  DIGEST_SPONSOR_FIRST_VIEWPORT_ID,
  DIGEST_SPONSOR_LEAD,
  DIGEST_SPONSOR_OVERVIEW_TITLE,
  DIGEST_SPONSOR_PRIMARY_CONTENT_ID,
  DIGEST_SPONSOR_SKIP_LINK_LABEL,
  DIGEST_SPONSOR_SKIP_TARGET_ID,
} from "@/lib/marketing/digest-sponsor-page-copy";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import type { ExecDigestSponsorDeepLinkView } from "@/lib/digest/exec-digest-sponsor-deep-link-server";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";

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

describe("ExecDigestSponsorDeepLinkPanel buyer-polished shell", () => {
  it("renders skip link, orientation above digest body, and Sources links", () => {
    render(<ExecDigestSponsorDeepLinkPanel view={view} />);

    expect(screen.getByRole("link", { name: DIGEST_SPONSOR_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DIGEST_SPONSOR_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("digest-sponsor-primary-content")).toHaveAttribute(
      "id",
      DIGEST_SPONSOR_PRIMARY_CONTENT_ID,
    );

    const primaryContent = screen.getByTestId("digest-sponsor-primary-content");
    const hero = screen.getByTestId("digest-sponsor-hero");
    const firstViewport = screen.getByTestId(DIGEST_SPONSOR_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("digest-sponsor-orientation-top");
    const dashboard = screen.getByTestId("exec-digest-sponsor-dashboard");
    const sourcesSection = screen.getByTestId("digest-sponsor-sources");

    expect(primaryContent).toContainElement(hero);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(hero);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(dashboard);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(dashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(within(orientationTop).getByTestId("digest-sponsor-claim-discipline").textContent).toContain(
      DIGEST_SPONSOR_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 1, name: DIGEST_SPONSOR_OVERVIEW_TITLE })).toBeInTheDocument();
    expect(screen.getByText(DIGEST_SPONSOR_LEAD)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EVALUATION_SOURCES_TITLE })).toBeInTheDocument();
    expect(screen.getAllByTestId("digest-sponsor-sources")).toHaveLength(1);

    for (const source of filterWhereToGoNextFollowUpLinks(DIGEST_SPONSOR_SOURCES)) {
      expect(within(sourcesSection).getByRole("link", { name: source.label })).toHaveAttribute(
        "href",
        source.href,
      );
    }
  });
});
