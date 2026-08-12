import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { recycleBinPageDescription } from "@/lib/projects-recycle-bin-payload";
import {
  PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_HREF,
  PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_HREF,
  PROJECTS_RECYCLE_BIN_PAGE_TITLE,
} from "@/lib/projects-recycle-bin-page-copy";
import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/tenant/recycle-bin",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { ProjectsRecycleBinPageHeader } from "@/app/(operator)/administration/tenant/recycle-bin/_sections/ProjectsRecycleBinPageHeader";

describe("ProjectsRecycleBinPageHeader", () => {
  it("renders Administration breadcrumb, title, help, and refresh (TB-1289)", () => {
    const onRefresh = vi.fn();
    const subtitle = recycleBinPageDescription(30);

    render(
      <ProjectsRecycleBinPageHeader loading={false} subtitle={subtitle} onRefresh={onRefresh} />,
    );

    expect(screen.getByRole("heading", { level: 2, name: PROJECTS_RECYCLE_BIN_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-page-breadcrumb")).toHaveTextContent("Administration");
    expect(screen.getByTestId("projects-recycle-bin-page-breadcrumb")).toHaveTextContent("Workspace settings");
    expect(screen.getByTestId("projects-recycle-bin-page-breadcrumb")).toHaveTextContent(PROJECTS_RECYCLE_BIN_PAGE_TITLE);
    expect(screen.getByRole("link", { name: "Administration" })).toHaveAttribute(
      "href",
      PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_HREF,
    );
    expect(screen.getByRole("link", { name: "Workspace settings" })).toHaveAttribute(
      "href",
      PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_HREF,
    );
    expect(screen.getByText(subtitle)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-refresh-button")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("projects-recycle-bin-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
