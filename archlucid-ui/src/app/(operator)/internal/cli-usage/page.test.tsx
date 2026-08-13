import { describe, expect, it, vi } from "vitest";

import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";

const permanentRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  permanentRedirect: (path: string) => permanentRedirect(path),
}));

import CliUsageInternalPage from "./page";

describe("CliUsageInternalPage", () => {
  it("permanently redirects the retired internal path to the canonical help topic", () => {
    CliUsageInternalPage();

    expect(permanentRedirect).toHaveBeenCalledWith("/help/cli-usage");
    expect(CLI_USAGE_HELP_PATH).toBe("/help/cli-usage");
  });
});
