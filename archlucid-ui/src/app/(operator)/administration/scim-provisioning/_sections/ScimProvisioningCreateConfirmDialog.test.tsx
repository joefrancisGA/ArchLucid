import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScimProvisioningCreateConfirmDialog } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningCreateConfirmDialog";
import {
  SCIM_CREATE_DIALOG_CONFIRM,
  SCIM_CREATE_DIALOG_DESCRIPTION,
  SCIM_CREATE_DIALOG_TITLE,
} from "@/lib/scim-provisioning-page-copy";

describe("ScimProvisioningCreateConfirmDialog", () => {
  it("delegates create copy to ConfirmationDialog", () => {
    const onConfirm = vi.fn();

    render(
      <ScimProvisioningCreateConfirmDialog open busy={false} onCancel={vi.fn()} onConfirm={onConfirm} />,
    );

    expect(screen.getByRole("heading", { name: SCIM_CREATE_DIALOG_TITLE })).toBeInTheDocument();
    expect(screen.getByText(SCIM_CREATE_DIALOG_DESCRIPTION)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: SCIM_CREATE_DIALOG_CONFIRM }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
