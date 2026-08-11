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

import AlertsPage from "./page";

describe("AlertsPage", () => {
  it("redirects legacy tab=inbox to canonical alerts inbox (TB-1594)", async () => {
    redirect.mockClear();

    await expect(
      AlertsPage({
        searchParams: Promise.resolve({ tab: "inbox", status: "Open" }),
      }),
    ).rejects.toThrow("redirect:/governance/alerts?status=Open");
  });

  it("renders inbox when tab param is absent", async () => {
    redirect.mockClear();

    const element = await AlertsPage({
      searchParams: Promise.resolve({ status: "Open" }),
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(element).toBeTruthy();
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
