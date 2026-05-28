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
    expect(screen.getByText("We could not find that in ArchLucid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByTestId("not-found-home")).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Reviews" })).toHaveAttribute("href", "/reviews?projectId=default");
    expect(screen.getByRole("link", { name: "Risk register" })).toHaveAttribute("href", "/governance/findings");
  });
});
