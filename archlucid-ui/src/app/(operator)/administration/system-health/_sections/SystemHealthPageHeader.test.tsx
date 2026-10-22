import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR } from "@/lib/system-health-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => ADMINISTRATION_SYSTEM_HEALTH_PATH,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { SystemHealthPageHeader } from "@/app/(operator)/administration/system-health/_sections/SystemHealthPageHeader";

describe("SystemHealthPageHeader", () => {
  it("renders h1, help, refresh, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();

    render(
      <SystemHealthPageHeader
        subtitle={SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR}
        loading={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "System health" })).toBeInTheDocument();
    expect(screen.getByText(SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("system-health-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("system-health-refresh-timestamp")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("system-health-refresh"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
