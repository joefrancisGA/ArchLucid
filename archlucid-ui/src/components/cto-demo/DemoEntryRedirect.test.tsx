import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();

vi.mock("@/lib/demo-entry-redirect", () => ({
  resolveDemoEntryRedirectHref: vi.fn(() => "/demo-target"),
}));

import { resolveDemoEntryRedirectHref } from "@/lib/demo-entry-redirect";
import { DemoEntryRedirect } from "@/components/cto-demo/DemoEntryRedirect";

describe("DemoEntryRedirect", () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(resolveDemoEntryRedirectHref).mockReturnValue("/demo-target");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { replace },
    });
  });

  it("replaces location on mount", async () => {
    render(<DemoEntryRedirect />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/demo-target");
    });
  });
});
