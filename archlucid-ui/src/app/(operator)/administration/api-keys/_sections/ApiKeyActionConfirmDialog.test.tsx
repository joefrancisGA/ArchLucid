import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiKeyActionConfirmDialog } from "@/app/(operator)/administration/api-keys/_sections/ApiKeyActionConfirmDialog";
import {
  API_KEYS_CONFIRM_ROTATE_ADMIN_TITLE,
  API_KEYS_CONFIRM_TYPE_PHRASE_ADMIN,
} from "@/lib/api-keys-settings-copy";

describe("ApiKeyActionConfirmDialog", () => {
  it("requires typed phrase before admin rotate confirm (TB-2365)", () => {
    const onConfirm = vi.fn();

    render(
      <ApiKeyActionConfirmDialog
        pendingAction={{ kind: "rotate_admin" }}
        busy={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: API_KEYS_CONFIRM_ROTATE_ADMIN_TITLE })).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: API_KEYS_CONFIRM_TYPE_PHRASE_ADMIN });

    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByTestId("api-key-confirm-phrase"), {
      target: { value: API_KEYS_CONFIRM_TYPE_PHRASE_ADMIN },
    });

    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
