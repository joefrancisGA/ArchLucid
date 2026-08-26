import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GetStartedPageClient } from "./GetStartedPageClient";
import {
  GET_STARTED_LAST_REVIEWED_LABEL,
  GET_STARTED_PRIMARY_CONTENT_ID,
} from "./get-started-content";
import { GET_STARTED_SKIP_LINK_LABEL } from "@/lib/get-started-page-copy";

describe("GetStartedPageClient buyer-polished shell (GXX)", () => {
  it("renders skip link, breadcrumb, top orientation strip, and hero meta", () => {
    render(<GetStartedPageClient />);

    expect(screen.getByRole("link", { name: GET_STARTED_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GET_STARTED_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.queryByTestId("get-started-breadcrumb")).toBeNull();
    expect(screen.getByTestId("get-started-hero-meta")).toHaveTextContent(GET_STARTED_LAST_REVIEWED_LABEL);
    expect(screen.getByTestId("get-started-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("get-started-sources")).toBeInTheDocument();
    expect(screen.getAllByTestId("get-started-sources")).toHaveLength(1);
    expect(screen.queryByTestId("get-started-claim-discipline")).toBeNull();

    const primaryContent = document.getElementById(GET_STARTED_PRIMARY_CONTENT_ID);
    const orientation = screen.getByTestId("get-started-orientation-top");

    expect(primaryContent).not.toBeNull();

    if (primaryContent !== null) {
      expect(orientation.compareDocumentPosition(primaryContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
