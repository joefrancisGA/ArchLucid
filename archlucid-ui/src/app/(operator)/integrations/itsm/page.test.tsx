import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import ItsmIntegrationPage from "./page";

describe("ItsmIntegrationPage", () => {
  it("redirects legacy combined route to Integration readiness", () => {
    ItsmIntegrationPage();
    expect(redirect).toHaveBeenCalledWith("/integrations/readiness");
  });
});
