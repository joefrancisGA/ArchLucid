import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectDeleteConfirmDialog } from "@/app/(operator)/administration/workspace-settings/_sections/ProjectDeleteConfirmDialog";
import {
  PROJECT_DELETE_CONFIRM_ACTION_LABEL,
  PROJECT_DELETE_CONFIRM_TITLE,
  projectDeleteConfirmDescription,
} from "@/lib/projects-delete-confirm-copy";

describe("ProjectDeleteConfirmDialog", () => {
  it("delegates project delete copy to ConfirmationDialog (TB-2367)", () => {
    const onConfirm = vi.fn();

    render(
      <ProjectDeleteConfirmDialog
        pending={{
          workspaceId: "ws-1",
          workspaceName: "Production",
          projectId: "proj-edge",
          projectName: "Edge",
        }}
        retentionDays={30}
        busy={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: PROJECT_DELETE_CONFIRM_TITLE })).toBeInTheDocument();
    expect(
      screen.getByText(projectDeleteConfirmDescription("Edge", "Production", 30)),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: PROJECT_DELETE_CONFIRM_ACTION_LABEL }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
