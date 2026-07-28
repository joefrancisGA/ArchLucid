import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligencePageClient } from "./ArchitectureIntelligencePageClient";

describe("ArchitectureIntelligencePageClient", () => {
  it("renders description input and action buttons", () => {
    render(<ArchitectureIntelligencePageClient />);

    expect(screen.getByTestId("architecture-intelligence-page")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-description")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-priorities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run architecture reasoning" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run golden test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load golden fixture" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish to findings/advisory" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-publish-toggle")).toBeInTheDocument();
  });
});
