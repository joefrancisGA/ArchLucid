import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AwsConnectionDisconnectDialog } from "@/app/(operator)/integrations/cloud-connections/_sections/AwsConnectionDisconnectDialog";

describe("AwsConnectionDisconnectDialog", () => {
  it("delegates disconnect copy to ConfirmationDialog (TB-2371)", () => {
    const onConfirm = vi.fn();

    render(
      <AwsConnectionDisconnectDialog
        target={{ connectionId: "conn-1", accountId: "123456789012" }}
        busy={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: "Disconnect AWS account 123456789012?" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Scheduled read-only inventory collection for this AWS account will stop. Previously collected inventory packages and any signed review records that cite them are retained.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("surfaces disconnect errors in extraContent (TB-2371)", () => {
    render(
      <AwsConnectionDisconnectDialog
        target={{ connectionId: "conn-1", accountId: "123456789012" }}
        busy={false}
        errorMessage="Disconnect failed."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByTestId("aws-connection-disconnect-error")).toHaveTextContent("Disconnect failed.");
  });
});
