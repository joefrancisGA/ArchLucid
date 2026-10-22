import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IdentityProvidersSaveConfirmDialog } from "@/app/(operator)/administration/identity-providers/_sections/IdentityProvidersSaveConfirmDialog";
import {
  IDENTITY_PROVIDERS_ACTION_SAVE,
  IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION,
  IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE,
} from "@/lib/identity-providers-settings-copy";

describe("IdentityProvidersSaveConfirmDialog", () => {
  it("delegates save copy to ConfirmationDialog (TB-2369)", () => {
    const onConfirm = vi.fn();

    render(
      <IdentityProvidersSaveConfirmDialog
        open
        busy={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE })).toBeInTheDocument();
    expect(screen.getByText(IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: IDENTITY_PROVIDERS_ACTION_SAVE }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
