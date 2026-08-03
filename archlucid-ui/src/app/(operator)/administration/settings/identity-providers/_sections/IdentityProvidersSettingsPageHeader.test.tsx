import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { identityProvidersPageSubtitle } from "@/lib/identity-providers-settings-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/settings/identity-providers",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { IdentityProvidersSettingsPageHeader } from "@/app/(operator)/administration/settings/identity-providers/_sections/IdentityProvidersSettingsPageHeader";

describe("IdentityProvidersSettingsPageHeader", () => {
  it("renders h1, help, refresh, diagnostics link, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();

    render(
      <IdentityProvidersSettingsPageHeader
        subtitle={identityProvidersPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Identity providers" })).toBeInTheDocument();
    expect(screen.getByText(identityProvidersPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-diagnostics-link")).toHaveAttribute(
      "href",
      "/administration/settings/identity-providers/diagnostics",
    );
    expect(screen.getByTestId("identity-providers-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("identity-providers-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
