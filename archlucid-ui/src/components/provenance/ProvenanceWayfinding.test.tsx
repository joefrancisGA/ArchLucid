import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProvenanceWayfinding } from "@/components/provenance/ProvenanceWayfinding";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ProvenanceWayfinding", () => {
  it("renders back to review and contextual help", () => {
    render(<ProvenanceWayfinding reviewPackageHref="/architecture/reviews/demo-run" />);

    expect(screen.getByTestId("provenance-back-to-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/demo-run",
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});
