import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureCreatedHomeViewport } from "@/components/architecture/ArchitectureCreatedHomeViewport";
import { ARCHITECTURE_CREATED_CONFIRMATION } from "@/lib/architecture/architecture-created-home-copy";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";

describe("ArchitectureCreatedHomeViewport", () => {
  it("renders architecture identity, summary, and a single primary action", () => {
    const model = buildArchitectureCreatedHomeModel({
      runId: "run-1",
      architectureName: "Retail API platform",
      architectureOverview:
        "A customer-facing retail API on Azure with private networking, Entra ID sign-in, and EU data residency requirements for payment isolation.",
      businessOutcome: "Launch a resilient retail API with clear compliance boundaries.",
      peopleAndSystems: [{ label: "Store associate", kind: "Human" }],
      ownerLabel: "alex@example.com",
      lastUpdatedLabel: "Jul 11, 2026",
      workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
      assessmentInProgress: false,
      hasArtifacts: false,
      correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
      gapAssertion: { businessOutcome: true, peopleAndSystems: true },
      gapSourceCapturedAtUtc: null,
    });

    render(<ArchitectureCreatedHomeViewport model={model} />);

    expect(screen.getByText(ARCHITECTURE_CREATED_CONFIRMATION)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Retail API platform" })).toBeInTheDocument();
    expect(screen.getByText("Business purpose")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-primary-action")).toHaveTextContent("Run initial assessment");
    expect(screen.queryByText("Review")).not.toBeInTheDocument();
  });
});
