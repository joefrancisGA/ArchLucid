import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import { ARCHITECTURE_DRAFT_ALTERNATIVES_HINT } from "@/lib/create-vs-review-intake-copy";
import {
  ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_LABEL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY,
} from "@/lib/architecture/architecture-draft-guidance-copy";
import { ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY } from "@/lib/architecture/architecture-draft-guidance-dismiss";

const mockUsePathname = vi.fn(() => "/architecture/architectures");

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => mockUsePathname(),
  });
});

describe("ArchitectureDraftGuidanceDisclosure", () => {
  afterEach(() => {
    window.localStorage.removeItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY);
    mockUsePathname.mockReturnValue("/architecture/architectures");
  });

  it("explains the draft vs review distinction without duplicating getting-started when that is the header topic", async () => {
    mockUsePathname.mockReturnValue("/architecture/architectures/draft-1");
    render(<ArchitectureDraftGuidanceDisclosure />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-guidance-disclosure")).toBeInTheDocument();
    });

    const disclosure = screen.getByTestId("architecture-draft-guidance-disclosure");

    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY);
    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD);
    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL);
    expect(screen.queryByRole("link", { name: "Getting started guide" })).not.toBeInTheDocument();
  });

  it("leaves the tradeoff prompt to the Architecture overview field so dismissing the tip cannot hide it", async () => {
    mockUsePathname.mockReturnValue("/architecture/architectures/draft-1");
    render(<ArchitectureDraftGuidanceDisclosure />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-guidance-disclosure")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-draft-guidance-disclosure").textContent ?? "").not.toContain(
      ARCHITECTURE_DRAFT_ALTERNATIVES_HINT,
    );
  });

  it("keeps getting-started help when the header topic is first-architecture-review (/new)", async () => {
    mockUsePathname.mockReturnValue("/architecture/architectures/new");
    render(<ArchitectureDraftGuidanceDisclosure />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-guidance-disclosure")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Getting started guide" })).toHaveAttribute(
      "href",
      "/help/getting-started",
    );
  });

  it("hides permanently after Hide this tip", async () => {
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
