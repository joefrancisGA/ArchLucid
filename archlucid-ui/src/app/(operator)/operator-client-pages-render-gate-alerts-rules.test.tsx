import "./operator-client-pages-render-gate.setup.tsx";

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

describe("operator client pages — render gate (alert rules)", () => {
  it("Alert rules content renders without a duplicate hub page-title h2 (TB-1584)", async () => {
    renderWithOperatorQuery(<AlertRulesContent />);
    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-layout")).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { level: 2, name: "Alert rules" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Configured alert rules" })).not.toBeInTheDocument();
  });
});
