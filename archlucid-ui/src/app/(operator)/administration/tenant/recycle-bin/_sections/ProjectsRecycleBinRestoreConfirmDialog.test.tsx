import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { projectsRecycleBinRestoreConfirmDescription } from "@/lib/projects-recycle-bin-restore-confirm-copy";

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

    expect(screen.getByTestId("projects-recycle-bin-restore-confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Restore project\?/)).toBeInTheDocument();
    expect(screen.getByText(/Contoso Core/)).toBeInTheDocument();
    expect(screen.getByText(/Production/)).toBeInTheDocument();
    expect(screen.getByTestId("recycle-restore-consequence-preview")).toBeInTheDocument();
  });
});
