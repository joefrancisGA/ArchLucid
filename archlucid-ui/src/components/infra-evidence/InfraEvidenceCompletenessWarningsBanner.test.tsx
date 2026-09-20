import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraEvidenceCompletenessWarningsBanner } from "@/components/infra-evidence/InfraEvidenceCompletenessWarningsBanner";

describe("InfraEvidenceCompletenessWarningsBanner", () => {
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

    expect(screen.getByTestId("infra-evidence-completeness-warnings-banner")).toBeInTheDocument();
    expect(screen.getByTestId("infra-evidence-completeness-warnings-details")).toBeInTheDocument();
    expect(screen.getByText("Inventory completeness warnings (2)")).toBeInTheDocument();
    expect(screen.getByText(/App setting hostnames not collected on hosted pull/)).toBeInTheDocument();
    expect(screen.getByText(/Role assignment scope is too broad/)).toBeInTheDocument();
  });
});
