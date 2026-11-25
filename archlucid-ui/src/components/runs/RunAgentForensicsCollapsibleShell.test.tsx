import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RunAgentForensicsCollapsibleShell } from "./RunAgentForensicsCollapsibleShell";

const { refresh, router } = vi.hoisted(() => {
  const refresh = vi.fn();
  return { refresh, router: { refresh } };
});
const pathname = "/architecture/reviews/review/dossier";

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  usePathname: () => pathname,
  useRouter: () => router,
}));

function panel(serverRenderId: string, contents: string) {
  return (
    <RunAgentForensicsCollapsibleShell serverRenderId={serverRenderId}>
      <p>{contents}</p>
    </RunAgentForensicsCollapsibleShell>
  );
}

function toggle(open: boolean) {
  const details = screen
    .getByText("Advanced — agent traces and structural evaluation (diagnostics)")
    .closest("details") as HTMLDetailsElement;
  details.open = open;
  fireEvent(details, new Event("toggle"));
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("RunAgentForensicsCollapsibleShell", () => {
  it("requires fresh server content on reopen and never restores revoked evidence", () => {
    window.history.replaceState(null, "", pathname);
    const { rerender } = render(panel("initial", "Initial evidence"));
    expect(screen.queryByText("Initial evidence")).not.toBeInTheDocument();

    toggle(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Checking current access");
    expect(screen.queryByText("Initial evidence")).not.toBeInTheDocument();

    rerender(panel("authorized", "Authorized evidence"));
    expect(screen.getByText("Authorized evidence")).toBeInTheDocument();

    toggle(false);
    expect(screen.queryByText("Authorized evidence")).not.toBeInTheDocument();
    toggle(true);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Authorized evidence")).not.toBeInTheDocument();

    rerender(panel("denied", "On-demand evaluation could not be loaded."));
    expect(screen.getByText("On-demand evaluation could not be loaded.")).toBeInTheDocument();
    expect(screen.queryByText("Authorized evidence")).not.toBeInTheDocument();
  });

  it("rechecks access for a deep link and for reopening from browser history", () => {
    const openUrl = pathname + "?runAgentForensicsOpen=1";
    window.history.replaceState(null, "", openUrl);
    const { rerender } = render(panel("link", "Cached deep link evidence"));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Cached deep link evidence")).not.toBeInTheDocument();
    rerender(panel("link-current", "Current evidence"));
    expect(screen.getByText("Current evidence")).toBeInTheDocument();

    window.history.replaceState(null, "", pathname);
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.queryByText("Current evidence")).not.toBeInTheDocument();
    window.history.replaceState(null, "", openUrl);
    fireEvent(window, new PopStateEvent("popstate"));
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toHaveTextContent("Checking current access");
    expect(screen.queryByText("Current evidence")).not.toBeInTheDocument();
  });
});
