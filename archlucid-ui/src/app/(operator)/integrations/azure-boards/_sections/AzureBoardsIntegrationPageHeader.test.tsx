import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AzureBoardsIntegrationPageHeader } from "@/app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageHeader";
import {
  AZURE_BOARDS_ACTION_REFRESH,
  AZURE_BOARDS_PAGE_SUBTITLE,
  AZURE_BOARDS_PAGE_TITLE,
} from "@/lib/azure-boards-page-copy";

describe("AzureBoardsIntegrationPageHeader", () => {
  it("renders title, subtitle, help, refresh, readiness link, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();
    const refreshedAt = new Date("2026-07-30T12:00:00.000Z");

    render(
      <AzureBoardsIntegrationPageHeader
        refreshing={false}
        lastRefreshedAt={refreshedAt}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByTestId("azure-boards-page-title")).toHaveTextContent(AZURE_BOARDS_PAGE_TITLE);
    expect(screen.getByText(AZURE_BOARDS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-refresh-button")).toHaveTextContent(AZURE_BOARDS_ACTION_REFRESH);
    expect(screen.getByTestId("azure-boards-readiness-link")).toHaveAttribute("href", "/administration/connection-status");
    expect(screen.getByTestId("azure-boards-last-refreshed")).toHaveTextContent(/last refreshed/i);

    fireEvent.click(screen.getByTestId("azure-boards-refresh-button"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
