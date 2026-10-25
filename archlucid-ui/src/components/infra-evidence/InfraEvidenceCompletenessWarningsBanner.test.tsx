import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraEvidenceCompletenessWarningsBanner } from "@/components/infra-evidence/InfraEvidenceCompletenessWarningsBanner";

describe("InfraEvidenceCompletenessWarningsBanner", () => {
  it("labels omitted completeness warnings as not stored", () => {
    render(<InfraEvidenceCompletenessWarningsBanner warnings={undefined} />);

    expect(screen.getByText("Completeness warnings were not stored.")).toBeInTheDocument();
  });

  it("renders nothing when warnings are empty", () => {
    const { container } = render(<InfraEvidenceCompletenessWarningsBanner warnings={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders warning details for snapshot completeness strings", () => {
    render(
      <InfraEvidenceCompletenessWarningsBanner
        warnings={[
          "app-settings-not-collected-hosted-get-only",
          "rbac-scope-too-broad:/subscriptions/sub",
        ]}
      />,
    );

    const banner = screen.getByTestId("infra-evidence-completeness-warnings-banner");

    expect(banner).toBeInTheDocument();
    expect(banner.className).not.toMatch(/amber/);
    expect(banner.className).toContain("bg-al-surface-raised");
    expect(screen.getByTestId("infra-evidence-completeness-warnings-details")).toBeInTheDocument();
    expect(screen.getByTestId("infra-evidence-completeness-warnings-count-tag")).toHaveTextContent(
      "2 completeness warnings",
    );
    expect(screen.getAllByText(/App setting hostnames not collected on hosted pull/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Role assignment scope is too broad/).length).toBeGreaterThan(0);
  });

  it("uses collection-gap lead copy for logic app missing warnings (P-18)", () => {
    render(
      <InfraEvidenceCompletenessWarningsBanner warnings={["logic-app-connections-missing"]} />,
    );

    expect(screen.getByText(/Some connection lines were not collected/)).toBeInTheDocument();
    expect(screen.queryByText(/weaker than the underlying authorization facts/)).not.toBeInTheDocument();
  });

  it("renders mode-aware missing class labels from the structured summary", () => {
    render(
      <InfraEvidenceCompletenessWarningsBanner
        warnings={["arg-nic-subnet-missing"]}
        summary={{
          mode: "network",
          visibleNodeCount: 12,
          visibleEdgeCount: 5,
          connectedComponentCount: 3,
          hiddenHopsUsedCount: 2,
          likelyInCollocationEdgeCount: 0,
          missingClasses: ["nicToSubnet"],
          collectedClasses: ["inventory-nic-subnet"],
        }}
      />,
    );

    expect(screen.getByText(/Missing: nicToSubnet/)).toBeInTheDocument();
    expect(screen.getByText(/\(2 from hidden attachment hops\)/)).toBeInTheDocument();
  });

  it("labels missing completeness summary counts without treating them as zero", () => {
    render(
      <InfraEvidenceCompletenessWarningsBanner
        warnings={["rbac-scope-too-broad:/subscriptions/sub"]}
        summary={{
          mode: "executive",
          visibleNodeCount: null,
          visibleEdgeCount: 0,
          connectedComponentCount: null,
          hiddenHopsUsedCount: 0,
          likelyInCollocationEdgeCount: 0,
          missingClasses: [],
          collectedClasses: [],
        }}
      />,
    );

    expect(screen.getByText(/Visible resource count was not stored/)).toBeInTheDocument();
    expect(screen.getByText(/Connected component count was not stored/)).toBeInTheDocument();
    expect(screen.queryByText(/0 resources in/)).not.toBeInTheDocument();
  });
});
