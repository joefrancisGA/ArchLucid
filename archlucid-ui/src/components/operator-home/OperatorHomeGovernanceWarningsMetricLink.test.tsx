import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { OperatorHomeGovernanceWarningsMetricLink } from "./OperatorHomeGovernanceWarningsMetricLink";

describe("OperatorHomeGovernanceWarningsMetricLink", () => {
  it("links to enable warnings when inactive", () => {
    useSearchParams.mockReturnValue(new URLSearchParams());

    render(<OperatorHomeGovernanceWarningsMetricLink count={2} label="Warnings" />);

    expect(screen.getByTestId("operator-home-governance-warnings-metric")).toHaveAttribute(
      "href",
      "/?warnings=1",
    );
    expect(screen.getByTestId("operator-home-governance-warnings-metric")).toHaveAttribute(
      "data-active",
      "false",
    );
    expect(screen.getByTestId("operator-home-governance-warnings-metric").className).toMatch(/no-underline/);
  });

  it("links to clear warnings when already active", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("warnings=1&tab=attention"));

    render(<OperatorHomeGovernanceWarningsMetricLink count={2} label="Warnings" />);

    expect(screen.getByTestId("operator-home-governance-warnings-metric")).toHaveAttribute("href", "/?tab=attention");
    expect(screen.getByTestId("operator-home-governance-warnings-metric")).toHaveAttribute(
      "data-active",
      "true",
    );
  });
});
