import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();

vi.mock("@/lib/demo-entry-redirect", () => ({
  resolveDemoEntryRedirectHref: vi.fn(() => "/demo-target"),
}));

import { resolveDemoEntryRedirectHref } from "@/lib/demo-entry-redirect";
import { DemoEntryRedirect } from "@/components/cto-demo/DemoEntryRedirect";
import { DEMO_ENTRY_REDIRECTING_LABEL } from "@/lib/demo-entry-evidence-copy";

describe("DemoEntryRedirect", () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(resolveDemoEntryRedirectHref).mockReturnValue("/demo-target");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { replace },
    });
  });

  it("replaces location on mount and shows interim Evidence chrome", async () => {
    render(<DemoEntryRedirect />);

    expect(screen.getByTestId("demo-entry-redirect")).toBeInTheDocument();
    expect(screen.getByTestId("demo-entry-redirecting")).toHaveTextContent(DEMO_ENTRY_REDIRECTING_LABEL);
    expect(screen.queryByTestId("demo-entry-orientation")).toBeNull(); // TB-2092
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/demo-target");
    });

    expect(screen.getByTestId("demo-entry-continue")).toHaveAttribute("href", "/demo-target");
  });
});
