import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { CronExpressionBuilder } from "./CronExpressionBuilder";

describe("CronExpressionBuilder", () => {
  it("shows next five scheduled runs for the current expression", () => {
    render(<CronExpressionBuilder value="0 7 * * *" onChange={vi.fn()} />);

    expect(screen.getByTestId("cron-next-runs-preview")).toBeInTheDocument();
    expect(screen.getByText(/Next 5 scheduled runs/i)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBe(5);
  });

  it("calls onChange when the expression input changes", () => {
    const onChange = vi.fn();

    render(<CronExpressionBuilder value="@daily" onChange={onChange} />);

    fireEvent.change(screen.getByTestId("cron-expression-input"), {
      target: { value: "@hourly" },
    });

    expect(onChange).toHaveBeenCalledWith("@hourly");
  });
});
