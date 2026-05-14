import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BuyerDeliverablesArtifactTabs } from "./BuyerDeliverablesArtifactTabs";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const base = {
  artifactId: "artifact-guid-1",
  name: "file.json",
  format: "json",
  createdUtc: "2020-01-01T00:00:00Z",
  contentHash: "abcdef123456",
};

describe("BuyerDeliverablesArtifactTabs", () => {
  it("switches between executive and architecture review board artifact groupings", () => {
    const artifacts = [
      { ...base, artifactId: "md", artifactType: "MarkdownReport", name: "b.md", format: "text/markdown" },
      { ...base, artifactId: "jb", artifactType: "JsonBundle", name: "decisions.json" },
    ];

    render(
      <BuyerDeliverablesArtifactTabs manifestId="manifest-1" runId="run-1" artifacts={artifacts} />,
    );

    expect(screen.getByTestId("buyer-deliverables-artifact-tabs")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Executive and sponsor artifacts" }).getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Architecture review board artifacts" }));

    expect(screen.getByRole("heading", { name: "Architecture review board" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Executive and sponsor artifacts" }));

    expect(screen.getByRole("heading", { name: "Executive & sponsor" })).toBeInTheDocument();
  });
});
