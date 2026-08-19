import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { AdminEvidenceProposalsPageClient } from "@/app/(operator)/internal/evidence-proposals/_sections/AdminEvidenceProposalsPageClient";

const HTML_STACK_BODY =
  "<html>at Foo.cs:12\n--- INNER ---\nNullReferenceException: boom</html>";

const PENDING_PROPOSAL = {
  resultId: "res-1",
  runId: "run-1",
  agentType: "evidence",
  proposedEvidenceJson: "{}",
  createdUtc: "2026-08-16T00:00:00.000Z",
  isPromoted: false,
};

describe("AdminEvidenceProposalsPageClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the claim-discipline orientation strip on the live admin page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );

    render(<AdminEvidenceProposalsPageClient />);

    expect(await screen.findByTestId("admin-evidence-proposals-page")).toBeInTheDocument();
    expect(screen.queryByTestId("evidence-proposals-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("does not surface HTML or stack traces when the proposals list returns 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(HTML_STACK_BODY, { status: 500, statusText: "Internal Server Error" })),
    );

    render(<AdminEvidenceProposalsPageClient />);

    const alert = await screen.findByTestId("admin-evidence-proposals-error");

    expect(alert).toHaveTextContent(/Request failed \(500/i);
    expect(alert).not.toHaveTextContent("NullReferenceException");
    expect(alert).not.toHaveTextContent("<html>");
    expect(screen.queryByText("No pending evidence proposals.")).not.toBeInTheDocument();
  });

  it("shows sanitized ProblemDetails detail when the list returns application/problem+json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: "Service Unavailable", detail: "The evidence catalog is temporarily unavailable." }), {
          status: 503,
          headers: { "content-type": "application/problem+json" },
        }),
      ),
    );

    render(<AdminEvidenceProposalsPageClient />);

    const alert = await screen.findByTestId("admin-evidence-proposals-error");

    expect(alert).toHaveTextContent("The evidence catalog is temporarily unavailable.");
  });

  it("does not surface HTML or stack traces when promote returns 500", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/promote") && (init?.method ?? "GET") === "POST") {
        return new Response(HTML_STACK_BODY, { status: 500, statusText: "Internal Server Error" });
      }

      return new Response(JSON.stringify([PENDING_PROPOSAL]), { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<AdminEvidenceProposalsPageClient />);

    fireEvent.click(await screen.findByRole("button", { name: "Promote to catalog" }));

    const alert = await screen.findByTestId("admin-evidence-proposals-error");

    expect(alert).toHaveTextContent(/Request failed \(500/i);
    expect(alert).not.toHaveTextContent("NullReferenceException");
    expect(alert).not.toHaveTextContent("<html>");
  });
});
