import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { policyPacksPageSubtitle } from "@/lib/policy-packs-page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/policy-packs",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PolicyPacksPageHeader } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksPageHeader";

describe("PolicyPacksPageHeader", () => {
  it("renders h1, help, refresh, and last-refreshed metadata without a duplicate policy-packs help link", () => {
    const onRefresh = vi.fn();

    render(
      <PolicyPacksPageHeader
        subtitle={policyPacksPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Policy packs" })).toBeInTheDocument();
    expect(screen.getByText(policyPacksPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-resolution-link")).toHaveAttribute(
      "href",
      "/help/policy-packs#how-conflicts-are-resolved",
    );
    expect(screen.getByRole("link", { name: /How conflicts are resolved/i })).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("policy-packs-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
