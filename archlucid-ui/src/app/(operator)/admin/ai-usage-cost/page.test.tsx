import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import AiUsageAndCostLegacyPage from "./page";

describe("AiUsageAndCostLegacyPage", () => {
  it("redirects legacy internal route to Administration AI usage", () => {
    AiUsageAndCostLegacyPage();
    expect(redirect).toHaveBeenCalledWith("/settings/ai-usage");
  });
});
