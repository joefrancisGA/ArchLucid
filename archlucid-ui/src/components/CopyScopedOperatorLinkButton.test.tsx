import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CopyScopedOperatorLinkButton } from "@/components/CopyScopedOperatorLinkButton";
import * as shareableOperatorLink from "@/lib/shareable-operator-link";
import * as toast from "@/lib/toast";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/infrastructure/ask",
  useSearchParams: () => new URLSearchParams("cloudResourceId=11111111-1111-1111-1111-111111111111"),
}));

describe("CopyScopedOperatorLinkButton", () => {
  it("shows an error toast when clipboard copy fails", async () => {
    vi.spyOn(shareableOperatorLink, "copyShareableOperatorLink").mockResolvedValue(false);
    const showError = vi.spyOn(toast, "showError");

    render(<CopyScopedOperatorLinkButton />);
    fireEvent.click(screen.getByTestId("infra-copy-scoped-link"));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(
        "Could not copy scoped link",
        "Clipboard access is unavailable in this browser.",
      );
    });
  });

  it("shows a manual copy fallback when clipboard copy fails", async () => {
    vi.spyOn(shareableOperatorLink, "buildShareableOperatorUrl").mockReturnValue(
      "https://example.test/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
    vi.spyOn(shareableOperatorLink, "copyShareableOperatorLink").mockResolvedValue(false);

    render(<CopyScopedOperatorLinkButton testId="infra-ask-copy-scoped-link" />);
    fireEvent.click(screen.getByTestId("infra-ask-copy-scoped-link"));

    await waitFor(() => {
      expect(screen.getByTestId("infra-ask-copy-scoped-link-fallback")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue(
      "https://example.test/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111",
    )).toBeInTheDocument();
  });
});
