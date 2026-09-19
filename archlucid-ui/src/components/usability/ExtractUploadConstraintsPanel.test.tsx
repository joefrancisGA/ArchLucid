import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const productLineState = vi.hoisted(() => ({ current: "architecture" as "architecture" | "security" }));

vi.mock("@/hooks/use-localized-product-copy", () => ({
  useLocalizedProductCopy: () => ({
    productLine: productLineState.current,
    localize: (text: string) => {
      if (productLineState.current === "security") {
        return text.replaceAll("architecture reviews", "security reviews");
      }

      return text;
    },
  }),
}));

import { ExtractUploadConstraintsPanel } from "@/components/usability/ExtractUploadConstraintsPanel";

describe("ExtractUploadConstraintsPanel", () => {
  it("uses security reviews copy on the SecureNow product line", () => {
    productLineState.current = "security";

    render(<ExtractUploadConstraintsPanel />);

    expect(screen.getByText(/security reviews/i)).toBeInTheDocument();
    expect(screen.queryByText(/architecture reviews/i)).not.toBeInTheDocument();
  });

  it("keeps architecture reviews copy on the Architecture product line", () => {
    productLineState.current = "architecture";

    render(<ExtractUploadConstraintsPanel />);

    expect(screen.getByText(/architecture reviews/i)).toBeInTheDocument();
  });
});
