import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import { OperatorBrandedTransientFailure } from "./OperatorBrandedTransientFailure";

describe("OperatorBrandedTransientFailure", () => {
  it("renders timeout copy and retry affordance", () => {
    render(
      <OperatorBrandedTransientFailure
        failure={{
          message: "The operation was aborted due to timeout",
          problem: null,
          correlationId: "corr-timeout",
          httpStatus: null,
          retryAfterSeconds: null,
        }}
        retryLabel="Retry loading review"
      />,
    );

    expect(screen.getByText("ArchLucid is taking longer than expected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry loading review" })).toBeInTheDocument();
    expect(screen.getByText("Request timed out")).toBeInTheDocument();
    expect(screen.getByText("ArchLucid · TIMEOUT")).toBeInTheDocument();
    expect(screen.getByText("corr-timeout")).toBeInTheDocument();
  });

  it("renders unavailable copy for upstream outage", () => {
    render(
      <OperatorBrandedTransientFailure
        failure={{
          message: "Upstream API unreachable",
          problem: null,
          correlationId: null,
          httpStatus: 502,
          retryAfterSeconds: null,
        }}
      />,
    );

    expect(screen.getByText("ArchLucid is temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByText("ArchLucid · UNAVAILABLE")).toBeInTheDocument();
  });
});
