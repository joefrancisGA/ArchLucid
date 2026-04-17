import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "sampleRunId" ? "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501" : null),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: vi.fn(),
  getRunSummary: vi.fn(),
}));

import { NewRunWizardClient } from "./NewRunWizardClient";

describe("NewRunWizardClient (sampleRunId query)", () => {
  it("shows trial sample callout on step 1 when sampleRunId is present", () => {
    render(<NewRunWizardClient />);

    expect(screen.getByTestId("wizard-open-trial-sample-run")).toHaveAttribute(
      "href",
      "/runs/6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
    );
  });
});
