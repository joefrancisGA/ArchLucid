import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-502",
}));

import { OperatorApiProblem } from "./OperatorApiProblem";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("OperatorApiProblem", () => {
  it("renders heading and body from problem", () => {
    render(
      <OperatorApiProblem
        problem={{ title: "Not found", detail: "Missing resource." }}
        fallbackMessage="fallback"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Not found");
    expect(screen.getByText("Missing resource.")).toBeInTheDocument();
  });

  it("renders support hint when present", () => {
    render(
      <OperatorApiProblem
        problem={{ title: "T", detail: "D", supportHint: "Contact support with the reference below." }}
        fallbackMessage="f"
      />,
    );

    expect(screen.getByText("Contact support with the reference below.")).toBeInTheDocument();
  });

  it("shows correlation id line when provided", () => {
    render(
      <OperatorApiProblem problem={null} fallbackMessage="Plain error" correlationId="abc-123" />,
    );

    expect(screen.getByText("Provide request ID")).toBeInTheDocument();
    expect(screen.getAllByText("abc-123").length).toBeGreaterThan(0);
  });

  it("reads correlation id from problem details when prop omitted", () => {
    render(
      <OperatorApiProblem
        problem={{ title: "Failed", detail: "Bad gateway", correlationId: "from-problem-json" }}
        fallbackMessage="fallback"
      />,
    );

    expect(screen.getAllByText("from-problem-json").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Copy request ID" }).length).toBeGreaterThan(0);
  });

  it("generates request id when correlation id is missing", () => {
    render(<OperatorApiProblem problem={null} fallbackMessage="Plain error" />);

    expect(screen.getByText("Provide request ID")).toBeInTheDocument();
  });

  it("treats omitted problem details like null (no throw)", () => {
    render(<OperatorApiProblem problem={undefined} fallbackMessage="Something went wrong." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
  });

  it("does not surface ERR reference text to the user (logged to console only)", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    render(<OperatorApiProblem problem={null} fallbackMessage="Plain error" />);

    expect(screen.queryByText(/^Reference: ERR-/)).not.toBeInTheDocument();

    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it("renders rate limit copy when failure has httpStatus 429", () => {
    render(
      <OperatorApiProblem
        failure={{
          message: "Slow down",
          problem: { title: "Throttled", detail: "Too many concurrent requests" },
          correlationId: null,
          httpStatus: 429,
          retryAfterSeconds: 5,
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Too many requests");
    expect(screen.getByText("Too many concurrent requests")).toBeInTheDocument();
    expect(screen.getByText(/5 seconds/)).toBeInTheDocument();
  });

  it("uses warning callout when variant is warning", () => {
    render(
      <OperatorApiProblem
        problem={{ title: "Secondary", detail: "Soft failure" }}
        fallbackMessage="f"
        variant="warning"
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Secondary");
    expect(status).toHaveTextContent("Soft failure");
  });

  it("uses error callout by default", () => {
    render(
      <OperatorApiProblem problem={{ title: "Err", detail: "Bad" }} fallbackMessage="f" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Err");
  });

  it("renders field-scoped validation errors for HTTP 400", () => {
    render(
      <OperatorApiProblem
        problem={{
          title: "One or more validation errors occurred.",
          status: 400,
          instance: "/v1/architecture/request",
          fieldErrors: [{ field: "Description", messages: ["Description must not exceed 4000 characters."] }],
        }}
        fallbackMessage="fallback"
        httpStatus={400}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Request validation failed (HTTP 400)");
    expect(screen.getByTestId("operator-api-problem-validation")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByText("Description must not exceed 4000 characters.")).toBeInTheDocument();
    expect(screen.queryByText(/at ArchLucid\./)).not.toBeInTheDocument();
  });

  it("uses layered connectivity copy for upstream API unreachable failures", () => {
    render(
      <OperatorApiProblem
        failure={{
          message: "Upstream API unreachable: fetch failed",
          problem: {
            title: "Upstream API unreachable",
            detail: "fetch failed",
            supportHint: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local.",
          },
          correlationId: "req-layered-502",
          httpStatus: 502,
          retryAfterSeconds: null,
        }}
      />,
    );

    const primary = within(screen.getByTestId("operator-connectivity-primary"));

    expect(primary.getByText("Workspace data unavailable")).toBeInTheDocument();
    expect(primary.queryByText("fetch failed")).toBeNull();
    expect(primary.queryByText(/ARCHLUCID_API_BASE_URL/i)).toBeNull();
    expect(primary.queryByText("req-layered-502")).toBeNull();
    expect(primary.queryByText(/First-pilot triage cards/i)).toBeNull();
    expect(primary.getByRole("link", { name: "System health" })).toHaveAttribute("href", "/administration/system-health");

    const detailsEl = screen.getByTestId("operator-connectivity-technical-details");
    expect(detailsEl).not.toHaveAttribute("open");
    expect(detailsEl.textContent ?? "").toContain("fetch failed");
    expect(detailsEl.textContent ?? "").toContain("req-layered-502");
  });

  it("renders Report problem and opens dialog with correlation id prefilled (TB-785)", () => {
    render(
      <OperatorApiProblem
        problem={{ title: "Service unavailable", detail: "Try again later." }}
        fallbackMessage="Service unavailable"
        correlationId="corr-api-502"
        httpStatus={503}
      />,
    );

    fireEvent.click(screen.getByTestId("report-problem-trigger"));

    expect(screen.getByTestId("report-problem-dialog")).toBeInTheDocument();
    expect(within(screen.getByTestId("report-problem-context-summary")).getByText("corr-api-502")).toBeInTheDocument();
  });

  it("maps RESOURCE_NOT_FOUND failure to buyer heading, not raw problem title (TB-2137)", () => {
    render(
      <OperatorApiProblem
        failure={{
          message: "Resource not found",
          problem: { title: "Not Found", errorCode: "RESOURCE_NOT_FOUND", detail: "Missing workspace item." },
          correlationId: "corr-nf",
          httpStatus: 404,
          retryAfterSeconds: null,
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Not found in this workspace");
    expect(screen.queryByText(/^Not Found$/)).not.toBeInTheDocument();
    expect(screen.getByText(/workspace selector/i)).toBeInTheDocument();
  });

  it("hides Report problem on validation-only HTTP 400 (TB-785)", () => {
    render(
      <OperatorApiProblem
        problem={{
          title: "One or more validation errors occurred.",
          status: 400,
          instance: "/v1/architecture/request",
          fieldErrors: [{ field: "Description", messages: ["Description must not exceed 4000 characters."] }],
        }}
        fallbackMessage="fallback"
        httpStatus={400}
      />,
    );

    expect(screen.queryByTestId("report-problem-trigger")).not.toBeInTheDocument();
  });
});
