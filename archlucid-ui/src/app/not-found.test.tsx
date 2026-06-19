import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import NotFound from "./not-found";

describe("not-found", () => {
  it("renders operator-facing copy and navigation links", () => {
    render(<NotFound />);

    expect(screen.getByTestId("branded-not-found")).toHaveTextContent("Page not found");
    expect(screen.getByText("We could not find that ArchLucid artifact")).toBeInTheDocument();
    expect(
      screen.getByText(/review package, evidence item, finding, or workspace item/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/If the review was just created, wait a moment and retry/i)).toBeInTheDocument();
    expect(
      screen.getByText(/open Review packages and confirm the workspace selector is set correctly/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByTestId("not-found-home")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("not-found-review-packages")).toHaveAttribute(
      "href",
      "/reviews?projectId=default",
    );
    expect(screen.getByTestId("not-found-start-review")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByTestId("not-found-sample-review")).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.queryByRole("link", { name: "Risk register" })).not.toBeInTheDocument();
  });
});
