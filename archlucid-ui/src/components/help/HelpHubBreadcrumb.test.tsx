import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  HELP_HUB_BREADCRUMB_HUB_LABEL,
  HELP_HUB_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/help/help-hub-page-copy";

import { HelpHubBreadcrumb } from "./HelpHubBreadcrumb";

describe("HelpHubBreadcrumb", () => {
  it("renders Welcome → Help trail", () => {
    render(<HelpHubBreadcrumb />);

    const breadcrumb = screen.getByTestId("help-hub-breadcrumb");
    expect(breadcrumb).toHaveTextContent(HELP_HUB_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(HELP_HUB_BREADCRUMB_TOPIC_TITLE);
  });
});
