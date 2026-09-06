import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SpecialtyTemplateCloudContextPicker } from "@/components/help/SpecialtyTemplateCloudContextPicker";
import {
  SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_INTRO,
  SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_LEGEND,
  SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_SELECTION_NOTE,
} from "@/lib/specialty-review-templates";

describe("SpecialtyTemplateCloudContextPicker", () => {
  it("renders cloud options with shared copy constants", () => {
    render(
      <SpecialtyTemplateCloudContextPicker
        fieldsetId="specialty-cloud-context"
        cloudContext="None"
        onCloudChange={vi.fn()}
      />,
    );

    expect(screen.getByText(SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_LEGEND)).toBeInTheDocument();
    expect(screen.getByText(SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_INTRO)).toBeInTheDocument();
    expect(screen.queryByTestId("specialty-template-cloud-context-selection-note")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Azure" })).toBeInTheDocument();
  });

  it("shows the selection note when SaaS readiness is selected", () => {
    const onCloudChange = vi.fn();

    render(
      <SpecialtyTemplateCloudContextPicker
        fieldsetId="specialty-cloud-context"
        cloudContext="Azure"
        onCloudChange={onCloudChange}
        showSelectionNote
      />,
    );

    expect(screen.getByTestId("specialty-template-cloud-context-selection-note")).toHaveTextContent(
      SPECIALTY_REVIEW_TEMPLATES_CLOUD_CONTEXT_SELECTION_NOTE,
    );

    fireEvent.click(screen.getByRole("radio", { name: "AWS" }));

    expect(onCloudChange).toHaveBeenCalledWith("Aws");
  });
});
