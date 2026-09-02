import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";

import { ArchitectureScopeUnderstandingCheckFields } from "./ArchitectureScopeUnderstandingCheckFields";

const bullets: ScopeUnderstandingBullet[] = [
  {
    id: "system",
    kind: "system",
    label: "System",
    value: "Vertex",
    source: "inferred",
  },
];

const baseProps = {
  bullets,
  confirmed: false,
  scopeStale: false,
  scopePersistFailed: false,
  editingAllowed: true,
  canConfirmScope: false,
  confirmedBriefLineCount: 0,
  scopePersistenceInFlight: false,
  newBulletText: "",
  canAddBullet: false,
  addErrorMessage: null,
  onNewBulletTextChange: vi.fn(),
  onAddBullet: vi.fn(),
  onRowValueChange: vi.fn(),
  onRowRemove: vi.fn(),
  onConfirm: vi.fn(),
  onEditScope: vi.fn(),
  onNextStepJump: vi.fn(),
};

describe("ArchitectureScopeUnderstandingCheckFields", () => {
  it("renders bullet rows and confirm-readiness helper", () => {
    render(<ArchitectureScopeUnderstandingCheckFields {...baseProps} />);

    expect(screen.getByTestId("architecture-scope-understanding-bullets")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Vertex")).toBeInTheDocument();
    expect(screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-scope-understanding-confirm-readiness")).toHaveTextContent(
      SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT,
    );
  });

  it("calls onAddBullet when Enter is pressed on a valid draft row", () => {
    const onAddBullet = vi.fn();

    render(
      <ArchitectureScopeUnderstandingCheckFields
        {...baseProps}
        newBulletText="Payments API"
        canAddBullet
        onAddBullet={onAddBullet}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText(SCOPE_UNDERSTANDING_ADD_LABEL), { key: "Enter" });

    expect(onAddBullet).toHaveBeenCalledTimes(1);
  });
});
