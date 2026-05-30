import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusTag } from "@/components/StatusTag";

describe("StatusTag", () => {
  it("renders canonical enterprise labels", () => {
    render(<StatusTag kind="ready" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("allows label override", () => {
    render(<StatusTag kind="neutral" label="Monitoring active" />);
    expect(screen.getByText("Monitoring active")).toBeInTheDocument();
  });
});
