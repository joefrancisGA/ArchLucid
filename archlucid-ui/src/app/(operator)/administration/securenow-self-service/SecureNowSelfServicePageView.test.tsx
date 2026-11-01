import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowSelfServicePageView } from "./SecureNowSelfServicePageView";

describe("SecureNowSelfServicePageView", () => {
  it("renders the four checks and support mailto", () => {
    render(<SecureNowSelfServicePageView />);

    expect(screen.getByTestId("securenow-self-service-page")).toBeInTheDocument();
    for (const title of [
      "Collection missing or stale",
      "Connector will not finish",
      "No ranked path, or not verified",
      "Still stuck",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Email support" })).toHaveAttribute(
      "href",
      "mailto:support@archlucid.net?subject=SecureNow",
    );
  });
});
