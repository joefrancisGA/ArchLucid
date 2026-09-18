import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => true,
}));

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { SECURENOW_SECURITY_HOME_ROWS } from "@/lib/product-line/securenow-security-home-copy";

describe("SecureNowHomeDestinationSection", () => {
  it("renders destination links without a redundant Open column", () => {
    render(
      <SecureNowHomeDestinationSection
        heading="Security"
        lead="Triage assigned findings."
        rows={SECURENOW_SECURITY_HOME_ROWS}
        sectionTestId="securenow-security-home-section"
        headingId="securenow-security-home-heading"
        tableAriaLabel="SecureNow security operations destinations"
        linkTestIdPrefix="securenow-security-home-link"
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Destination" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Summary" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Open" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open" })).not.toBeInTheDocument();
    expect(screen.getByTestId(`securenow-security-home-link-${SECURENOW_SECURITY_HOME_ROWS[0]?.href}`)).toBeInTheDocument();
  });
});
