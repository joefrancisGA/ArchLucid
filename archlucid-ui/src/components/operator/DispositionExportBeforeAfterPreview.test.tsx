import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DispositionExportBeforeAfterPreview } from "@/components/operator/DispositionExportBeforeAfterPreview";

describe("DispositionExportBeforeAfterPreview (TB-2193)", () => {
  it("renders Before and After columns for the pending disposition", () => {
    render(<DispositionExportBeforeAfterPreview disposition="Deferred" findingTitle="Edge encryption" />);

    expect(screen.getByTestId("disposition-export-before-after")).toBeInTheDocument();
    expect(screen.getByTestId("disposition-export-before-after-before")).toHaveTextContent("Before");
    expect(screen.getByTestId("disposition-export-before-after-after")).toHaveTextContent("After");
    expect(screen.getByTestId("disposition-export-before-after")).toHaveTextContent("Packet preview — Deferred");
    expect(screen.getByTestId("disposition-export-before-after-after")).toHaveTextContent("Edge encryption");
  });
});
