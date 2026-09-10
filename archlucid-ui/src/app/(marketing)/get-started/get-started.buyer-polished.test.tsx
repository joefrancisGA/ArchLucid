import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GET_STARTED_PRIMARY_CONTENT_ID } from "./get-started-content";
import { GetStartedPageClient } from "./GetStartedPageClient";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import {
  GET_STARTED_ORIENTATION_SOURCES,
  GET_STARTED_SCOPE_DISCLOSURE_BODY,
} from "@/lib/get-started-evidence-copy";
import {
  GET_STARTED_FIRST_VIEWPORT_ID,
  GET_STARTED_SKIP_LINK_LABEL,
  GET_STARTED_SKIP_TARGET_ID,
} from "@/lib/get-started-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";

describe("GetStartedPageClient buyer-polished shell (GXX)", () => {
  it("renders skip link, orientation above path selection, and Sources links", () => {
    render(<GetStartedPageClient />);

    expect(screen.getByRole("link", { name: GET_STARTED_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GET_STARTED_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("get-started-primary-content")).toHaveAttribute(
      "id",
      GET_STARTED_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("get-started-breadcrumb")).toBeNull();

    const primaryContent = screen.getByTestId("get-started-primary-content");
    const hero = screen.getByTestId("get-started-hero");
    const firstViewport = screen.getByTestId(GET_STARTED_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("get-started-orientation-top");
    const pathSelection = screen.getByTestId("get-started-choose-sample-path");
    const sourcesSection = screen.getByTestId("get-started-sources");

    expect(primaryContent).toContainElement(hero);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(hero);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(pathSelection);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(pathSelection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(within(orientationTop).getByTestId("get-started-claim-discipline").textContent).toContain(
      GET_STARTED_SCOPE_DISCLOSURE_BODY.slice(0, 40),
    );
    expect(screen.getByTestId("get-started-hero-meta")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EVALUATION_SOURCES_TITLE })).toBeInTheDocument();
    expect(screen.getAllByTestId("get-started-sources")).toHaveLength(1);

    for (const source of filterWhereToGoNextFollowUpLinks(GET_STARTED_ORIENTATION_SOURCES)) {
      expect(within(sourcesSection).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
