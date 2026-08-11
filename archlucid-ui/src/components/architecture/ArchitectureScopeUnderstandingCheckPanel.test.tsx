import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL,
  SCOPE_UNDERSTANDING_ADD_HINT,
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
} from "@/lib/architecture-scope-understanding-check";

import { ArchitectureScopeUnderstandingCheckPanel } from "./ArchitectureScopeUnderstandingCheckPanel";

describe("ArchitectureScopeUnderstandingCheckPanel", () => {
  it("exposes a labeled add path and keeps Add to scope disabled until text is entered", () => {
    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{
          architectureName: "Vertex",
          businessOutcome: "Faster review cycles",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: SCOPE_UNDERSTANDING_HEADING })).toBeInTheDocument();
    expect(screen.getByText(SCOPE_UNDERSTANDING_HELPER)).toBeInTheDocument();
    expect(screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-scope-understanding-add-hint")).toHaveTextContent(
      SCOPE_UNDERSTANDING_ADD_HINT,
    );
    expect(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL })).toBeDisabled();
  });

  it("adds a typed item via Add to scope and clears the draft field", () => {
    const onBulletsChange = vi.fn();

    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex" }}
        onBulletsChange={onBulletsChange}
      />,
    );

    const addInput = screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL);

    fireEvent.change(addInput, { target: { value: "PCI cardholder data zone" } });
    fireEvent.click(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL }));

    expect(screen.getByDisplayValue("PCI cardholder data zone")).toBeInTheDocument();
    expect(addInput).toHaveValue("");
    expect(onBulletsChange).toHaveBeenCalled();
    expect(
      onBulletsChange.mock.calls.at(-1)?.[0].some(
        (bullet: { text: string }) => bullet.text === "PCI cardholder data zone",
      ),
    ).toBe(true);
  });

  it("adds a typed item when Enter is pressed in the add field", () => {
    render(<ArchitectureScopeUnderstandingCheckPanel input={{ architectureName: "Vertex" }} />);

    const addInput = screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL);

    fireEvent.change(addInput, { target: { value: "Legacy batch out of scope" } });
    fireEvent.keyDown(addInput, { key: "Enter" });

    expect(screen.getByDisplayValue("Legacy batch out of scope")).toBeInTheDocument();
    expect(addInput).toHaveValue("");
  });

  it("confirms scope after the operator chooses Confirm scope", () => {
    const onGateChange = vi.fn();

    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex" }}
        onGateChange={onGateChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_CONFIRM_LABEL }));

    expect(screen.getByTestId("architecture-scope-understanding-ready")).toBeInTheDocument();
    expect(onGateChange).toHaveBeenCalledWith(true);
  });
});
