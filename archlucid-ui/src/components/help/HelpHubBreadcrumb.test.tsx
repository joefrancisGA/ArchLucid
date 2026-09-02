import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  HELP_HUB_BREADCRUMB_HUB_LABEL,
  HELP_HUB_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/help/help-hub-page-copy";

import { HelpHubBreadcrumb } from "./HelpHubBreadcrumb";

describe("HelpHubBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<HelpHubBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("help-hub-breadcrumb")).toBeNull();
    expect(HELP_HUB_BREADCRUMB_HUB_LABEL).toBeTruthy();
    expect(HELP_HUB_BREADCRUMB_TOPIC_TITLE).toBeTruthy();
  });
});
