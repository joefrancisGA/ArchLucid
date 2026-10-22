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
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  BRANDED_NOT_FOUND_GENERIC_BODY,
  BRANDED_NOT_FOUND_GENERIC_TITLE,
  BRANDED_NOT_FOUND_RETRY_HINT,
  BRANDED_NOT_FOUND_WORKSPACE_HINT,
} from "@/lib/operator/operator-branded-not-found-copy";

describe("not-found", () => {
  it("renders operator-facing copy and navigation links", () => {
    render(<NotFound />);

    expect(screen.getByTestId("branded-not-found")).toHaveTextContent("Page not found");
    expect(screen.getByText(BRANDED_NOT_FOUND_GENERIC_TITLE)).toBeInTheDocument();
    expect(screen.getByText(BRANDED_NOT_FOUND_GENERIC_BODY)).toBeInTheDocument();
    expect(screen.getByText(BRANDED_NOT_FOUND_RETRY_HINT)).toBeInTheDocument();
    expect(screen.getByText(BRANDED_NOT_FOUND_WORKSPACE_HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByTestId("not-found-review-packages")).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
    expect(screen.getByTestId("not-found-start-review")).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByTestId("not-found-start-review")).toHaveTextContent(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    expect(screen.getByTestId("not-found-sample-review")).toHaveAttribute(
      "href",
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
    expect(screen.queryByRole("link", { name: "Findings" })).not.toBeInTheDocument();
    expect(screen.queryByText(/ArchLucid · 404/i)).not.toBeInTheDocument();
  });
});
