import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { recycleBinPageDescription } from "@/lib/projects-recycle-bin-payload";
import { PROJECTS_RECYCLE_BIN_PAGE_TITLE } from "@/lib/projects-recycle-bin-page-copy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/workspace-settings/recycle-bin",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { ProjectsRecycleBinPageHeader } from "@/app/(operator)/administration/workspace-settings/recycle-bin/_sections/ProjectsRecycleBinPageHeader";

describe("ProjectsRecycleBinPageHeader", () => {
  it("renders title, help, and refresh (TB-1289)", () => {
    const onRefresh = vi.fn();
    const subtitle = recycleBinPageDescription(30);

    render(
      <ProjectsRecycleBinPageHeader loading={false} subtitle={subtitle} onRefresh={onRefresh} />,
    );

    expect(screen.getByRole("heading", { level: 2, name: PROJECTS_RECYCLE_BIN_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("projects-recycle-bin-page-breadcrumb")).toBeNull();
    expect(screen.getByText(subtitle)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-refresh-button")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("projects-recycle-bin-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
