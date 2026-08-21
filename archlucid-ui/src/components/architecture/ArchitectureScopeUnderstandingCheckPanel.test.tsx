import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  scopeBulletBehavior,
  scopeReadOnlyHint,
  SCOPE_ITEM_DUPLICATE_MESSAGE,
  SCOPE_ITEM_NO_LETTER_MESSAGE,
  SCOPE_ITEM_TOO_SHORT_MESSAGE,
  SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL,
  SCOPE_UNDERSTANDING_ADD_EFFECT_HINT,
  SCOPE_UNDERSTANDING_ADD_HINT,
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";

import { ArchitectureScopeUnderstandingCheckPanel } from "./ArchitectureScopeUnderstandingCheckPanel";

const LONG_OVERVIEW = "Vertex is a B2B SaaS tenant migration platform. ".repeat(10);

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
    expect(screen.getByTestId("architecture-scope-understanding-add-effect")).toHaveTextContent(
      SCOPE_UNDERSTANDING_ADD_EFFECT_HINT,
    );
    expect(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL })).toBeDisabled();
  });

  it("labels each derived row instead of folding the field name into editable text", () => {
    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex", businessOutcome: "Faster review cycles" }}
      />,
    );

    expect(screen.getByLabelText(scopeBulletBehavior("system").label)).toHaveValue("Vertex");
    expect(screen.getByLabelText(scopeBulletBehavior("outcome").label)).toHaveValue("Faster review cycles");
  });

  it("shows the architecture context as a read-only preview that points at the field that owns it", () => {
    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex", architectureOverview: LONG_OVERVIEW }}
        contextSourceLabel="Architecture overview above"
      />,
    );

    expect(screen.getByTestId("architecture-scope-readonly-context")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-scope-readonly-hint-context")).toHaveTextContent(
      scopeReadOnlyHint("Architecture overview above"),
    );
    expect(screen.queryByLabelText(scopeBulletBehavior("context").label)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: `Remove ${scopeBulletBehavior("context").label} from scope`,
      }),
    ).not.toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: "Remove PCI cardholder data zone from scope" }),
    ).toBeInTheDocument();
    expect(
      onBulletsChange.mock.calls.at(-1)?.[0].some(
        (bullet: ScopeUnderstandingBullet) =>
          bullet.kind === "custom" && bullet.value === "PCI cardholder data zone",
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

  it("blocks and explains an item that is too short to review", () => {
    render(<ArchitectureScopeUnderstandingCheckPanel input={{ architectureName: "Vertex" }} />);

    fireEvent.change(screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL), { target: { value: "ab" } });

    expect(screen.getByTestId("architecture-scope-understanding-add-error")).toHaveTextContent(
      SCOPE_ITEM_TOO_SHORT_MESSAGE,
    );
    expect(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL })).toBeDisabled();
  });

  it("blocks gibberish with no letters in it", () => {
    render(<ArchitectureScopeUnderstandingCheckPanel input={{ architectureName: "Vertex" }} />);

    const addInput = screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL);

    fireEvent.change(addInput, { target: { value: "1234!!" } });

    expect(screen.getByTestId("architecture-scope-understanding-add-error")).toHaveTextContent(
      SCOPE_ITEM_NO_LETTER_MESSAGE,
    );
    expect(addInput).toHaveAttribute("aria-invalid", "true");

    fireEvent.keyDown(addInput, { key: "Enter" });

    expect(screen.queryByLabelText(scopeBulletBehavior("custom").label)).not.toBeInTheDocument();
    expect(addInput).toHaveValue("1234!!");
  });

  it("blocks an item that repeats a row already in scope", () => {
    render(<ArchitectureScopeUnderstandingCheckPanel input={{ architectureName: "Vertex" }} />);

    fireEvent.change(screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL), {
      target: { value: "vertex" },
    });

    expect(screen.getByTestId("architecture-scope-understanding-add-error")).toHaveTextContent(
      SCOPE_ITEM_DUPLICATE_MESSAGE,
    );
  });

  it("keeps spaces while the operator types in a row", () => {
    render(<ArchitectureScopeUnderstandingCheckPanel input={{ architectureName: "Vertex" }} />);

    const systemRow = screen.getByLabelText(scopeBulletBehavior("system").label);

    fireEvent.change(systemRow, { target: { value: "Vertex " } });

    expect(systemRow).toHaveValue("Vertex ");
  });

  it("keeps an operator edit when the form above changes", () => {
    const { rerender } = render(
      <ArchitectureScopeUnderstandingCheckPanel input={{ architectureName: "Vertex", businessOutcome: "Faster" }} />,
    );

    fireEvent.change(screen.getByLabelText(scopeBulletBehavior("system").label), {
      target: { value: "Vertex EU only" },
    });

    rerender(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex", businessOutcome: "Faster and cheaper" }}
      />,
    );

    expect(screen.getByLabelText(scopeBulletBehavior("system").label)).toHaveValue("Vertex EU only");
    expect(screen.getByLabelText(scopeBulletBehavior("outcome").label)).toHaveValue("Faster and cheaper");
  });

  it("does not show Remove on intake-derived rows that generation depends on", () => {
    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex", businessOutcome: "Faster review cycles" }}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: `Remove ${scopeBulletBehavior("system").label} from scope`,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: `Remove ${scopeBulletBehavior("outcome").label} from scope`,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not bring back a custom row the operator removed", () => {
    render(<ArchitectureScopeUnderstandingCheckPanel input={{ architectureName: "Vertex" }} />);

    fireEvent.change(screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL), {
      target: { value: "PCI cardholder data zone" },
    });
    fireEvent.click(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Remove PCI cardholder data zone from scope" }));

    expect(screen.queryByDisplayValue("PCI cardholder data zone")).not.toBeInTheDocument();
  });

  it("keeps Confirm scope disabled until a brief-backed in-scope item exists", () => {
    render(<ArchitectureScopeUnderstandingCheckPanel input={{}} />);

    expect(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_CONFIRM_LABEL })).toBeDisabled();
    expect(screen.getByTestId("architecture-scope-understanding-confirm-readiness")).toHaveTextContent(
      SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT,
    );
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

  it("shows a Saving chip instead of the ready line while draft persistence is in flight", () => {
    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex" }}
        draftSaveState="saving"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_CONFIRM_LABEL }));

    expect(screen.getByTestId("architecture-scope-understanding-saving")).toHaveTextContent("Saving…");
    expect(screen.queryByTestId("architecture-scope-understanding-ready")).not.toBeInTheDocument();
  });

  it("shows a save error after scope is confirmed when draft persistence failed", () => {
    render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex" }}
        draftSaveState="error"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_CONFIRM_LABEL }));

    expect(screen.getByTestId("architecture-scope-understanding-save-error")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-scope-understanding-saving")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-scope-understanding-ready")).not.toBeInTheDocument();
  });

  it("reopens the gate when the form changes after scope was confirmed", () => {
    const onGateChange = vi.fn();

    const { rerender } = render(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex" }}
        onGateChange={onGateChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: SCOPE_UNDERSTANDING_CONFIRM_LABEL }));

    rerender(
      <ArchitectureScopeUnderstandingCheckPanel
        input={{ architectureName: "Vertex 2" }}
        onGateChange={onGateChange}
      />,
    );

    expect(screen.queryByTestId("architecture-scope-understanding-ready")).not.toBeInTheDocument();
    expect(onGateChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByLabelText(scopeBulletBehavior("system").label)).toHaveValue("Vertex 2");
  });
});
