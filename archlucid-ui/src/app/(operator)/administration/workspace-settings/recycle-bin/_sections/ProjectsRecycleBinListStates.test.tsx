import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ProjectsRecycleBinEmptyState,
  ProjectsRecycleBinLoadingNotice,
} from "@/app/(operator)/administration/workspace-settings/recycle-bin/_sections/ProjectsRecycleBinListStates";
import {
  PROJECTS_RECYCLE_BIN_EMPTY_STATE_STATUS_LABEL,
  PROJECTS_RECYCLE_BIN_EMPTY_STATE_TITLE,
  PROJECTS_RECYCLE_BIN_LOADING_NOTICE,
} from "@/lib/projects-recycle-bin-page-copy";

describe("ProjectsRecycleBinListStates (TB-1291)", () => {
  it("renders OperatorLoadingNotice with aria-busy wrapper", () => {
    render(<ProjectsRecycleBinLoadingNotice />);

    const loading = screen.getByTestId("projects-recycle-bin-loading-notice");

    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(PROJECTS_RECYCLE_BIN_LOADING_NOTICE);
  });

  it("renders compact empty state with quiet StatusTag and retention copy", () => {
    render(<ProjectsRecycleBinEmptyState retentionDays={30} />);

    expect(screen.getByTestId("projects-recycle-bin-empty-state")).toBeInTheDocument();
    expect(screen.getByText(PROJECTS_RECYCLE_BIN_EMPTY_STATE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-empty-status")).toHaveTextContent(
      PROJECTS_RECYCLE_BIN_EMPTY_STATE_STATUS_LABEL,
    );
    expect(screen.getByTestId("projects-recycle-bin-empty-delete-surface-link")).toHaveAttribute(
      "href",
      "/administration/workspace-settings",
    );
    expect(screen.getByRole("link", { name: "Workspace settings" })).toHaveAttribute(
      "href",
      "/administration/workspace-settings",
    );
    expect(screen.getByRole("link", { name: "Architecture drafts" })).toHaveAttribute(
      "href",
      "/architecture/architectures",
    );
    expect(screen.getByText(/30-day retention window/)).toBeInTheDocument();
  });
});
