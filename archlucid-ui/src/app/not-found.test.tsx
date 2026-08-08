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

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import NotFound from "./not-found";

describe("not-found", () => {
  it("renders operator-facing copy and navigation links", () => {
    render(<NotFound />);

    expect(screen.getByTestId("branded-not-found")).toHaveTextContent("Page not found");
    expect(screen.getByText("We could not find that ArchLucid artifact")).toBeInTheDocument();
    expect(
      screen.getByText(/review, evidence item, finding, or workspace item/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/If the review was just created, wait a moment and retry/i)).toBeInTheDocument();
    expect(
      screen.getByText(/open Reviews and confirm the workspace selector is set correctly/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByTestId("not-found-review-packages")).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
    expect(screen.getByTestId("not-found-start-review")).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByTestId("not-found-sample-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/claims-intake-modernization",
    );
    expect(screen.queryByRole("link", { name: "Findings" })).not.toBeInTheDocument();
  });
});
