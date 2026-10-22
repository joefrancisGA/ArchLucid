import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsRolesMatrixConfirmDialog } from "@/app/(operator)/administration/users/_sections/SettingsRolesMatrixConfirmDialog";
import { ROLES_MATRIX_CONFIRMATION_DIALOG } from "@/app/(operator)/administration/users/_sections/roles-matrix-constants";

describe("SettingsRolesMatrixConfirmDialog", () => {
  it("renders permission deltas and high-risk callout (TB-2374)", () => {
    const onConfirm = vi.fn();

    render(
      <SettingsRolesMatrixConfirmDialog
        open
        copy={{
          title: ROLES_MATRIX_CONFIRMATION_DIALOG.saveTitle,
          primaryLabel: ROLES_MATRIX_CONFIRMATION_DIALOG.savePrimary,
          addedLabels: ["Manage billing"],
          removedLabels: ["Read reviews"],
          highRiskLabels: ["Manage billing"],
        }}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: ROLES_MATRIX_CONFIRMATION_DIALOG.saveTitle })).toBeInTheDocument();
    expect(screen.getByText("Permissions to grant")).toBeInTheDocument();
    expect(screen.getByText("Permissions to remove")).toBeInTheDocument();
    expect(screen.getByText(ROLES_MATRIX_CONFIRMATION_DIALOG.highRiskLead)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: ROLES_MATRIX_CONFIRMATION_DIALOG.savePrimary }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
