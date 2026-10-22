import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";

describe("ConfirmationDialog", () => {
  it("renders title and description", () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("renders reversibility notice when mutation id is provided", () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        title="Approve change"
        description="Proceed?"
        confirmLabel="Apply"
        reversibilityMutationId="governance_workflow_promote"
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByTestId("mutation-reversibility-notice-governance_workflow_promote")).toBeInTheDocument();
  });

  it("calls onConfirm when action button clicked", () => {
    const onConfirm = vi.fn();

    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        title="Approve change"
        description="Proceed?"
        confirmLabel="Apply"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancel clicked", () => {
    const onOpenChange = vi.fn();

    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        title="Title"
        description="Body"
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables both buttons when busy=true", () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        title="Working"
        description="Please wait."
        onConfirm={vi.fn()}
        busy
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Processing/u })).toBeDisabled();
  });

  it("disables confirm when confirmDisabled=true", () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={vi.fn()}
        title="Rotate admin key?"
        description="This invalidates the current key."
        confirmLabel="Rotate admin key"
        onConfirm={vi.fn()}
        confirmDisabled
      />,
    );

    expect(screen.getByRole("button", { name: "Rotate admin key" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled();
  });
});
