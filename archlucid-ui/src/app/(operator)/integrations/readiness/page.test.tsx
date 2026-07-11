import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import IntegrationsReadinessPage from "@/app/(operator)/integrations/readiness/page";

vi.mock("@/components/integrations/ConnectorOperationsDashboard", () => ({
  ConnectorOperationsDashboard: () => <div data-testid="connector-operations-dashboard" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("IntegrationsReadinessPage", () => {
  it("renders operational intro and contextual help without inline layer guidance", () => {
    render(<IntegrationsReadinessPage />);

    expect(screen.getByRole("heading", { name: "Integration readiness" })).toBeInTheDocument();
    expect(
      screen.getByText(/which notification, ticketing, publishing, and delivery integrations are configured/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How integration readiness works" })).toHaveAttribute(
      "href",
      "/help/integration-readiness",
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("About integration readiness")).not.toBeInTheDocument();
    expect(screen.getByTestId("connector-operations-dashboard")).toBeInTheDocument();
  });
});
