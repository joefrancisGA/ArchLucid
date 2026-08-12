import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL,
  PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE,
  projectsRecycleBinRestoreConfirmDescription,
} from "@/lib/projects-recycle-bin-restore-confirm-copy";

import { ProjectsRecycleBinRestoreConfirmDialog } from "@/app/(operator)/administration/tenant/recycle-bin/_sections/ProjectsRecycleBinRestoreConfirmDialog";

describe("projects-recycle-bin-restore-confirm-copy", () => {
  it("names the project and workspace in restore semantics", () => {
    expect(projectsRecycleBinRestoreConfirmDescription("Contoso Core", "Production")).toContain("Contoso Core");
    expect(projectsRecycleBinRestoreConfirmDescription("Contoso Core", "Production")).toContain("Production");
    expect(projectsRecycleBinRestoreConfirmDescription("Contoso Core", "Production")).toContain("active projects");
  });
});

describe("ProjectsRecycleBinRestoreConfirmDialog", () => {
  it("renders project and workspace copy when pending", () => {
    render(
      <ProjectsRecycleBinRestoreConfirmDialog
        busy={false}
        pending={{
          workspaceId: "ws-1",
          workspaceName: "Production",
          projectId: "proj-1",
          projectName: "Contoso Core",
        }}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_TITLE })).toBeInTheDocument();
    expect(
      screen.getByText(projectsRecycleBinRestoreConfirmDescription("Contoso Core", "Production")),
    ).toBeInTheDocument();
    expect(screen.getByTestId("recycle-restore-consequence-preview")).toBeInTheDocument();
  });

  it("delegates restore confirm to ConfirmationDialog (TB-2368)", () => {
    const onConfirm = vi.fn();

    render(
      <ProjectsRecycleBinRestoreConfirmDialog
        busy={false}
        pending={{
          workspaceId: "ws-1",
          workspaceName: "Production",
          projectId: "proj-1",
          projectName: "Contoso Core",
        }}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: PROJECTS_RECYCLE_BIN_RESTORE_CONFIRM_ACTION_LABEL }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
