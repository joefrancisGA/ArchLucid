import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ACCOUNT_SECURITY_REMOVE_WARNING,
  AccountSecurityRemoveDialog,
} from "@/app/(operator)/administration/account-security/AccountSecurityRemoveDialog";

const sampleMethod = {
  identityId: "id-1",
  providerType: "EmailOtp",
  providerLabel: "Email code",
  maskedIdentifier: "y***@example.com",
  addedUtc: "2026-07-01T00:00:00.000Z",
  canRemove: true,
};

describe("AccountSecurityRemoveDialog", () => {
  it("delegates remove copy to ConfirmationDialog (TB-2366)", () => {
    const onConfirm = vi.fn();

    render(
      <AccountSecurityRemoveDialog
        method={sampleMethod}
        busy={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Remove Email code (y***@example.com)?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(ACCOUNT_SECURITY_REMOVE_WARNING)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
