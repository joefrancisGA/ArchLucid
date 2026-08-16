import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dialog } from "@/components/ui/dialog";
import { HelpSearchPanelHeader } from "./HelpSearchPanelHeader";
import { HELP_SEARCH_PANEL_SUBTITLE } from "@/lib/help/help-search-panel-catalog";

describe("HelpSearchPanelHeader", () => {
  it("renders breadcrumb, title, and subtitle", () => {
    render(
      <Dialog open>
        <HelpSearchPanelHeader subtitle={HELP_SEARCH_PANEL_SUBTITLE} />
      </Dialog>,
    );

    expect(screen.getByTestId("contextual-help-drawer-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-panel-title")).toHaveTextContent("Help");
    expect(screen.getByTestId("help-search-panel-subtitle")).toHaveTextContent(HELP_SEARCH_PANEL_SUBTITLE);
  });
});
