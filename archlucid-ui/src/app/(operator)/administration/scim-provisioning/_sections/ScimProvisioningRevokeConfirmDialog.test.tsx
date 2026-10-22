import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScimProvisioningRevokeConfirmDialog } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningRevokeConfirmDialog";
import {
  SCIM_REVOKE_DIALOG_CONFIRM,
  SCIM_REVOKE_DIALOG_DESCRIPTION,
  SCIM_REVOKE_DIALOG_TITLE,
} from "@/lib/scim-provisioning-page-copy";

describe("ScimProvisioningRevokeConfirmDialog", () => {
  it("delegates revoke copy to ConfirmationDialog (TB-2373)", () => {
    const onConfirm = vi.fn();

    render(
      <ScimProvisioningRevokeConfirmDialog open busy={false} onCancel={vi.fn()} onConfirm={onConfirm} />,
    );

    expect(screen.getByRole("heading", { name: SCIM_REVOKE_DIALOG_TITLE })).toBeInTheDocument();
    expect(screen.getByText(SCIM_REVOKE_DIALOG_DESCRIPTION)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: SCIM_REVOKE_DIALOG_CONFIRM }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
