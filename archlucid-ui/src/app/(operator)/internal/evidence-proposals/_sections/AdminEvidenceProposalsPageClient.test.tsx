import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

import { AdminEvidenceProposalsPageClient } from "@/app/(operator)/internal/evidence-proposals/_sections/AdminEvidenceProposalsPageClient";

const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

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
  beforeEach(() => {
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards operator scope headers when loading and promoting evidence proposals", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/promote") && (init?.method ?? "GET") === "POST") {
        return new Response(JSON.stringify({ catalogEntryId: "entry-1" }), { status: 200 });
      }

      return new Response(JSON.stringify([PENDING_PROPOSAL]), { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<AdminEvidenceProposalsPageClient />);

    fireEvent.click(await screen.findByRole("button", { name: "Promote to catalog" }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => (call[1] as RequestInit | undefined)?.method === "POST")).toBe(true);
    });

    const initialGet = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).includes("/api/proxy/v1/admin/evidence/proposals") &&
        !String(call[0]).includes("/promote") &&
        ((call[1] as RequestInit | undefined)?.method ?? "GET") === "GET",
    );
    expect(initialGet).toBeDefined();

    const getHeaders = new Headers((initialGet?.[1] as RequestInit | undefined)?.headers);
    expect(getHeaders.get("x-tenant-id")).toBe(tenantId);
    expect(getHeaders.get("x-workspace-id")).toBe(workspaceId);
    expect(getHeaders.get("x-project-id")).toBe(projectId);

    const promoteCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).includes("/promote") &&
        (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(promoteCall).toBeDefined();

    const promoteHeaders = new Headers((promoteCall?.[1] as RequestInit | undefined)?.headers);
    expect(promoteHeaders.get("x-tenant-id")).toBe(tenantId);
    expect(promoteHeaders.get("x-workspace-id")).toBe(workspaceId);
    expect(promoteHeaders.get("x-project-id")).toBe(projectId);
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
