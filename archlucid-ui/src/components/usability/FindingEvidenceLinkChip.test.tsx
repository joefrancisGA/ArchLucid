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

  it("falls back to evidence trail label without count", () => {
    render(<FindingEvidenceLinkChip href="/architecture/reviews/run-1/graph" />);

    expect(screen.getByTestId("finding-evidence-link-chip")).toHaveTextContent("Evidence trail");
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
