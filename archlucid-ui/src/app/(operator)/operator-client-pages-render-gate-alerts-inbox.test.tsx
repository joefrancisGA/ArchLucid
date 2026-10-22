import "./operator-client-pages-render-gate.setup.tsx";

import { vi } from "vitest";

vi.mock("@/components/alerts/AlertsInboxInteractiveClient", () => ({
  AlertsInboxInteractiveClient: () => <div data-testid="alerts-inbox-summary-row">Inbox stub</div>,
}));

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";

describe("operator client pages — render gate (alerts inbox)", () => {
  it("Alerts inbox content renders when workspace context is still loading", () => {
    render(<AlertsInboxContent />);
    expect(screen.getByTestId("alerts-inbox-summary-row")).toBeInTheDocument();
  });
});
