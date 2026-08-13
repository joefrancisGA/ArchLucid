import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GcpConnectionDisconnectDialog } from "@/app/(operator)/integrations/cloud-connections/_sections/GcpConnectionDisconnectDialog";

describe("GcpConnectionDisconnectDialog", () => {
  it("delegates disconnect copy to ConfirmationDialog (TB-2372)", () => {
    const onConfirm = vi.fn();

    render(
      <GcpConnectionDisconnectDialog
        target={{ connectionId: "gcp-1", projectId: "my-gcp-project" }}
        busy={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: "Disconnect GCP project my-gcp-project?" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Scheduled read-only inventory collection for this GCP project will stop. Previously collected inventory packages and any signed review records that cite them are retained.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("surfaces disconnect errors in extraContent (TB-2372)", () => {
    render(
      <GcpConnectionDisconnectDialog
        target={{ connectionId: "gcp-1", projectId: "my-gcp-project" }}
        busy={false}
        errorMessage="Disconnect failed."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByTestId("gcp-connection-disconnect-error")).toHaveTextContent("Disconnect failed.");
  });
});
