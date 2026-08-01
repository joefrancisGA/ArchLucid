import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import {
  ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_LABEL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY,
} from "@/lib/architecture-draft-guidance-copy";
import { ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY } from "@/lib/architecture-draft-guidance-dismiss";

describe("ArchitectureDraftGuidanceDisclosure", () => {
  afterEach(() => {
    window.localStorage.removeItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY);
  });

  it("explains the draft vs review distinction with a getting-started help link", async () => {
    render(<ArchitectureDraftGuidanceDisclosure />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-guidance-disclosure")).toBeInTheDocument();
    });

    const disclosure = screen.getByTestId("architecture-draft-guidance-disclosure");

    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY);
    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD);
    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL);
    expect(screen.getByRole("link", { name: "Getting started guide" })).toHaveAttribute(
      "href",
      "/help/getting-started",
    );
  });

  it("hides permanently after Don't show again", async () => {
    const { rerender } = render(<ArchitectureDraftGuidanceDisclosure />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-guidance-dismiss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_LABEL }));

    expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY)).toBe("1");

    rerender(<ArchitectureDraftGuidanceDisclosure />);

    await waitFor(() => {
      expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();
    });
  });
});
