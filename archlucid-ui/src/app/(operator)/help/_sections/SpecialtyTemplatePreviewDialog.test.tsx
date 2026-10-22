import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SpecialtyTemplatePreviewDialog } from "@/app/(operator)/help/_sections/SpecialtyTemplatePreviewDialog";
import {
  SPECIALTY_REVIEW_TEMPLATES,
  SPECIALTY_REVIEW_TEMPLATES_PREVIEW_CLOSE_LABEL,
  SPECIALTY_REVIEW_TEMPLATES_PREVIEW_DISCLAIMER,
  SPECIALTY_REVIEW_TEMPLATES_SAMPLE_REVIEW_LABEL,
} from "@/lib/specialty-review-templates";

describe("SpecialtyTemplatePreviewDialog", () => {
  const template = SPECIALTY_REVIEW_TEMPLATES.find((row) => row.id === "healthcare-claims");

  it("renders summary, footer CTAs, and sample review link", () => {
    if (template === undefined) {
      throw new Error("Expected healthcare-claims template.");
    }

    render(<SpecialtyTemplatePreviewDialog preview={{ template }} onClose={vi.fn()} />);

    const dialog = screen.getByTestId("specialty-template-preview-dialog");
    expect(within(dialog).getByTestId("specialty-template-preview-summary")).toHaveTextContent(/Best for:/i);
    expect(within(dialog).getByTestId("specialty-template-preview-summary")).toHaveTextContent(/Focus areas:/i);
    expect(within(dialog).getByTestId("specialty-template-preview-close")).toHaveTextContent(
      SPECIALTY_REVIEW_TEMPLATES_PREVIEW_CLOSE_LABEL,
    );
    expect(within(dialog).getByTestId("specialty-template-preview-sample-review")).toHaveAttribute(
      "href",
      template.sampleReviewHref,
    );
    expect(within(dialog).getByRole("link", { name: SPECIALTY_REVIEW_TEMPLATES_SAMPLE_REVIEW_LABEL })).toHaveAttribute(
      "href",
      template.sampleReviewHref,
    );
    expect(within(dialog).getByText(SPECIALTY_REVIEW_TEMPLATES_PREVIEW_DISCLAIMER)).toBeInTheDocument();
  });

  it("calls onClose when the footer close button is clicked", () => {
    if (template === undefined) {
      throw new Error("Expected healthcare-claims template.");
    }

    const onClose = vi.fn();

    render(<SpecialtyTemplatePreviewDialog preview={{ template }} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("specialty-template-preview-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
