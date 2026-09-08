import "./operator-client-pages-render-gate.setup.tsx";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";

describe("operator client pages — render gate (alert routing)", () => {
  it("Alert routing content renders primary heading", () => {
    render(<AlertRoutingContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Notification delivery" })).toBeInTheDocument();
  });
});
