import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { INLINE_METADATA_LABEL_CLASS } from "@/lib/design-tokens";

describe("InlineMetadataLabel", () => {
  it("renders medium label with trailing colon", () => {
    render(<InlineMetadataLabel label="Audit trail" testId="inline-metadata-audit" />);

    const label = screen.getByTestId("inline-metadata-audit");

    expect(label.tagName).toBe("SPAN");
    expect(label).toHaveClass(INLINE_METADATA_LABEL_CLASS.split(" ")[0]);
    expect(label).toHaveTextContent("Audit trail:");
  });

  it("does not double the colon when label already includes one", () => {
    render(<InlineMetadataLabel label="Evidence trail:" testId="inline-metadata-evidence" />);

    expect(screen.getByTestId("inline-metadata-evidence")).toHaveTextContent("Evidence trail:");
  });

  it("omits colon when withColon is false", () => {
    render(<InlineMetadataLabel label="Authority:" withColon={false} testId="inline-metadata-authority" />);

    expect(screen.getByTestId("inline-metadata-authority")).toHaveTextContent("Authority");
    expect(screen.getByTestId("inline-metadata-authority").textContent).not.toContain(":");
  });
});
