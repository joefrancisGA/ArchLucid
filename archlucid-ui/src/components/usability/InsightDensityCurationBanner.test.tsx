import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InsightDensityCurationBanner } from "./InsightDensityCurationBanner";

describe("InsightDensityCurationBanner", () => {
  it("renders curation message when counts present", () => {
    render(
      <InsightDensityCurationBanner
        curation={{ demotedToChecklistCount: 2, retainedFindingCount: 1 }}
      />,
    );

    expect(screen.getByTestId("insight-density-curation-banner")).toHaveTextContent("suppressed 2");
    expect(screen.getByTestId("insight-density-curation-banner")).toHaveTextContent("retained 1");
  });

  it("renders nothing when curation is null", () => {
    const { container } = render(<InsightDensityCurationBanner curation={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
