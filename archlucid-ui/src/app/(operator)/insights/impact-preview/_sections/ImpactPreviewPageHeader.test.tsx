import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { impactPreviewPageSubtitle } from "@/lib/impact-preview-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/impact-preview",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { ImpactPreviewPageHeader } from "@/app/(operator)/insights/impact-preview/_sections/ImpactPreviewPageHeader";

describe("ImpactPreviewPageHeader", () => {
  it("renders h1, help, refresh, and last-refreshed metadata", () => {
    const onRefresh = vi.fn();

    render(
      <ImpactPreviewPageHeader
        subtitle={impactPreviewPageSubtitle(false)}
        listLoading={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Impact preview" })).toBeInTheDocument();
    expect(screen.getByText(impactPreviewPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("impact-preview-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders a blocking status tag when provided", () => {
    render(
      <ImpactPreviewPageHeader
        subtitle={impactPreviewPageSubtitle(false)}
        listLoading={false}
        lastRefreshedAt={null}
        statusKind="needs-attention"
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Status: Action needed")).toBeInTheDocument();
  });
});
