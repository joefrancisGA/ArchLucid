import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { identityProvidersPageSubtitle } from "@/lib/identity-providers-settings-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers",
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    workspaceLabel: "Claims Intake Demo",
    tenantId: "tenant-1",
    projectLabel: "Default",
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { readonly triggerText?: string }) => (
    <div data-testid="page-contextual-help-button">{triggerText ?? "Help"}</div>
  ),
}));

import { IdentityProvidersSettingsPageHeader } from "@/app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsPageHeader";
import { IDENTITY_PROVIDERS_PAGE_TITLE } from "@/lib/identity-providers-settings-copy";

describe("IdentityProvidersSettingsPageHeader", () => {
  it("renders breadcrumb, short help trigger, refresh, diagnostics link, tenant scope, and status badge", () => {
    const onRefresh = vi.fn();

    render(
      <IdentityProvidersSettingsPageHeader
        subtitle={identityProvidersPageSubtitle(false)}
        statusLabel="Enabled"
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Identity providers" })).toBeInTheDocument();
    expect(screen.getByText(identityProvidersPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-page-breadcrumb")).toHaveTextContent("Administration");
    expect(screen.getByTestId("identity-providers-page-breadcrumb")).toHaveTextContent(IDENTITY_PROVIDERS_PAGE_TITLE);
    expect(screen.getByTestId("identity-providers-page-breadcrumb").textContent).not.toMatch(
      /Identity providers\s+Identity providers/,
    );
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Help");
    expect(screen.getByTestId("identity-providers-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-diagnostics-link")).toHaveAttribute(
      "href",
      "/administration/identity-providers/diagnostics",
    );
    expect(screen.getByTestId("identity-providers-tenant-scope")).toHaveTextContent("Claims Intake Demo");
    expect(screen.getByTestId("identity-providers-header-status-badge")).toHaveTextContent("Enabled");
    expect(screen.getByTestId("identity-providers-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("identity-providers-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
