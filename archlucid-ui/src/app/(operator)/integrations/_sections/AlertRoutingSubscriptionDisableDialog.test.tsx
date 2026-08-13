import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertRoutingSubscriptionDisableDialog } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";

describe("AlertRoutingSubscriptionDisableDialog", () => {
  it("delegates disable copy to ConfirmationDialog (TB-2363)", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <AlertRoutingSubscriptionDisableDialog
        target={{
          routingSubscriptionId: "sub-1",
          subscriptionName: "Ops alerts",
          channel: "slack",
        }}
        busy={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: /Disable Slack destination Ops alerts/i })).toBeInTheDocument();
    expect(screen.getByText(/Governance alerts will no longer post/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("renders API failure copy in extraContent", () => {
    render(
      <AlertRoutingSubscriptionDisableDialog
        target={{
          routingSubscriptionId: "sub-1",
          subscriptionName: "Ops alerts",
          channel: "webhook",
        }}
        busy={false}
        errorMessage="Could not disable destination."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByTestId("alert-routing-subscription-disable-error")).toHaveTextContent(
      "Could not disable destination.",
    );
  });
});
