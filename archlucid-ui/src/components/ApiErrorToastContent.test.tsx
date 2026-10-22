import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiErrorToastContent } from "@/components/ApiErrorToastContent";

describe("ApiErrorToastContent", () => {
  it("renders title, detail, and correlation id with copy control", () => {
    render(
      <ApiErrorToastContent title="Server error" detail="Database unavailable" correlationId="corr-abc-123" />,
    );

    expect(screen.getByText("Server error")).toBeInTheDocument();
    expect(screen.getByText("Database unavailable")).toBeInTheDocument();
    expect(screen.getByText("corr-abc-123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy correlation ID" })).toBeInTheDocument();
  });

  it("omits correlation block when id is absent", () => {
    render(<ApiErrorToastContent title="Request failed" />);

    expect(screen.queryByText("Correlation ID")).not.toBeInTheDocument();
  });
});
