import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    redirect: (target: string) => {
    redirect(target);
    throw new Error(`redirect:${target}`);
  },
    usePathname: () => "/",
  };
});

vi.mock("./_sections/load-alerts-inbox-page-model", () => ({
  loadAlertsInboxPageModel: vi.fn(async () => null),
}));

import AlertsPage from "./page";

describe("AlertsPage", () => {
  it("redirects legacy tab=inbox to canonical /governance/alerts", async () => {
    redirect.mockClear();

    await expect(
      AlertsPage({
        searchParams: Promise.resolve({ tab: "inbox", status: "Open" }),
      }),
    ).rejects.toThrow("redirect:/governance/alerts?status=Open");

    expect(redirect).toHaveBeenCalledWith("/governance/alerts?status=Open");
  });

  it("redirects configuration tabs to alert rules", async () => {
    redirect.mockClear();

    await expect(
      AlertsPage({
        searchParams: Promise.resolve({ tab: "rules" }),
      }),
    ).rejects.toThrow("redirect:/governance/alert-rules");
  });
});
