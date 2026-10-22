import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftQualityAttributesEncouragementDialog } from "./ArchitectureDraftQualityAttributesEncouragementDialog";

describe("ArchitectureDraftQualityAttributesEncouragementDialog", () => {
  it("offers add and continue-without actions", () => {
    const onAddQualityAttributes = vi.fn();
    const onContinueWithout = vi.fn();

    render(
      <ArchitectureDraftQualityAttributesEncouragementDialog
        open
        busy={false}
        onOpenChange={vi.fn()}
        onAddQualityAttributes={onAddQualityAttributes}
        onContinueWithout={onContinueWithout}
      />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-quality-attributes-encouragement-add"));
    expect(onAddQualityAttributes).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("architecture-draft-quality-attributes-encouragement-continue"));
    expect(onContinueWithout).toHaveBeenCalledTimes(1);
  });
});
