import { render, screen } from "@testing-library/react";
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
  it("renders sponsor and architecture review board sections without nested tabs", () => {
    const artifacts = [
      { ...base, artifactId: "md", artifactType: "MarkdownReport", name: "b.md", format: "text/markdown" },
      { ...base, artifactId: "jb", artifactType: "JsonBundle", name: "decisions.json" },
    ];

    render(
      <BuyerDeliverablesArtifactTabs manifestId="manifest-1" runId="run-1" artifacts={artifacts} />,
    );

    expect(screen.getByTestId("buyer-deliverables-artifact-tabs")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sponsor and sponsor artifacts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Architecture review board artifacts" })).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByTestId("buyer-deliverables-panel-sponsor")).toBeInTheDocument();
    expect(screen.getByTestId("buyer-deliverables-panel-arb")).toBeInTheDocument();
  });
});
