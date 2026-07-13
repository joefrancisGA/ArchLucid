import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDraftGuidanceDisclosure } from "@/components/architecture/ArchitectureDraftGuidanceDisclosure";
import {
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY,
} from "@/lib/architecture-draft-guidance-copy";

describe("ArchitectureDraftGuidanceDisclosure", () => {
  it("explains the draft vs review distinction with a getting-started help link", () => {
    render(<ArchitectureDraftGuidanceDisclosure />);

    const disclosure = screen.getByTestId("architecture-draft-guidance-disclosure");

    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY);
    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD);
    expect(disclosure.textContent ?? "").toContain(ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL);
    expect(screen.getByRole("link", { name: "Getting started guide" })).toHaveAttribute("href", "/help/getting-started");
  });
});
