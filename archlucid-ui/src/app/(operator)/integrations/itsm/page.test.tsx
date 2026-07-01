import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./_sections/ItsmIntegrationPageClient", () => ({
  ItsmIntegrationPageClient: () => <div data-testid="itsm-integration-page-client" />,
}));

import ItsmIntegrationPage from "./page";

describe("ItsmIntegrationPage", () => {
  it("renders the ITSM integration client surface", () => {
    render(<ItsmIntegrationPage />);

    expect(screen.getByTestId("itsm-integration-page-client")).toBeInTheDocument();
  });
});
