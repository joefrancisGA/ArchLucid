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
  it("renders inbox for legacy tab=inbox without redirect", async () => {
    redirect.mockClear();

    const element = await AlertsPage({
      searchParams: Promise.resolve({ tab: "inbox", status: "Open" }),
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
