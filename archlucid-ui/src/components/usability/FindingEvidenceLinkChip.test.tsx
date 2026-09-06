import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingEvidenceLinkChip } from "./FindingEvidenceLinkChip";

const chipSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "FindingEvidenceLinkChip.tsx"),
  "utf8",
);

describe("FindingEvidenceLinkChip", () => {
  it("shows linked count when evidence refs exist", () => {
    render(<FindingEvidenceLinkChip href="/architecture/reviews/run-1/graph" evidenceRefCount={3} />);

    expect(screen.getByTestId("finding-evidence-link-chip")).toHaveTextContent("Evidence: 3 linked");
  });

  it("falls back to evidence graph label without count", () => {
    render(<FindingEvidenceLinkChip href="/architecture/reviews/run-1/graph" />);

    expect(screen.getByTestId("finding-evidence-link-chip")).toHaveTextContent("Evidence graph");
  });

  it("uses column-scoped labels without repeating the Evidence category prefix", () => {
    render(
      <FindingEvidenceLinkChip
        href="/architecture/reviews/run-1/graph"
        evidenceRefCount={2}
        labelScope="column"
      />,
    );

    const link = screen.getByTestId("finding-evidence-link-chip");

    expect(link).toHaveTextContent("2 linked");
    expect(link).toHaveAttribute("aria-label", "Evidence: 2 linked");
    expect(link.textContent).not.toMatch(/^Evidence/i);
    expect(link.className).toContain("text-[13px]");
    expect(link.className).toContain("text-al-text-primary");
    expect(link.className).not.toContain("text-al-accent-interactive");
    expect(link.className).not.toContain("text-[11px]");
  });

  it("renders as a link-styled affordance, not a bordered badge/chip (TB-619)", () => {
    render(<FindingEvidenceLinkChip href="/architecture/reviews/run-1/graph" evidenceRefCount={1} />);

    const link = screen.getByTestId("finding-evidence-link-chip");

    expect(link.tagName).toBe("A");
    expect(link.className).toContain("underline");
    expect(link.className).not.toContain("border");
    expect(link.className).not.toContain("bg-white");
  });

  it("disables Next.js prefetch so list surfaces do not fan out finding inspect calls", () => {
    expect(chipSource).toContain("prefetch={false}");
  });
});
