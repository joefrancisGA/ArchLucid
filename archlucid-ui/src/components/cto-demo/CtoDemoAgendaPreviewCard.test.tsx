import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtoDemoAgendaPreviewCard } from "@/components/cto-demo/CtoDemoAgendaPreviewCard";

describe("CtoDemoAgendaPreviewCard", () => {
  it("lists all five journey steps with budgets", () => {
    render(<CtoDemoAgendaPreviewCard />);

    expect(screen.getByTestId("cto-demo-agenda-preview")).toBeInTheDocument();
    expect(screen.getByText(/26 min on the golden path/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });
});
