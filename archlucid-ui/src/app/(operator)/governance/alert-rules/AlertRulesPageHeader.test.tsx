import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { alertsConfigurationPageSubtitle } from "@/lib/alerts-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/alert-rules",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AlertRulesPageHeader } from "@/app/(operator)/governance/alert-rules/AlertRulesPageHeader";

describe("AlertRulesPageHeader", () => {
  it("renders h1, help, refresh, inbox link, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();

    render(
      <AlertRulesPageHeader
        subtitle={alertsConfigurationPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByText(alertsConfigurationPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-open-inbox-link")).toHaveAttribute("href", "/governance/alerts");
    expect(screen.getByTestId("alert-rules-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("alert-rules-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
