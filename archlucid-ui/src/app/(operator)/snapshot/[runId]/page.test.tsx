import { describe, expect, it, vi } from "vitest";

import { buildSnapshotRedirectPath } from "@/lib/legacy-snapshot-redirect";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    redirect(target);
    throw new Error(`redirect:${target}`);
  },
}));

import SnapshotPage from "./page";

describe("SnapshotPage (TB-1951 / TB-1953 / TB-1955)", () => {
  it("redirects showcase leave-behind links to the Claims Intake review workspace with readOnly=1", async () => {
    redirect.mockClear();

    await expect(
      SnapshotPage({
        params: Promise.resolve({ runId: SHOWCASE_STATIC_DEMO_RUN_ID }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(
      `redirect:/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}?readOnly=1`,
    );

    expect(redirect).toHaveBeenCalledWith(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}?readOnly=1`);
  });

  it("redirects non-showcase runs to their review workspace with readOnly=1", async () => {
    redirect.mockClear();
    const runId = "pilot-run-42";

    await expect(
      SnapshotPage({
        params: Promise.resolve({ runId }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(`redirect:/reviews/${runId}?readOnly=1`);
  });

  it("preserves inbound query params such as v=demo on redirect", async () => {
    redirect.mockClear();
    const params = { v: "demo", tag: ["a", "b"] };

    await expect(
      SnapshotPage({
        params: Promise.resolve({ runId: SHOWCASE_STATIC_DEMO_RUN_ID }),
        searchParams: Promise.resolve(params),
      }),
    ).rejects.toThrow(`redirect:${buildSnapshotRedirectPath(SHOWCASE_STATIC_DEMO_RUN_ID, params)}`);

    const target = redirect.mock.calls[0]?.[0] as string;
    expect(target).toContain("readOnly=1");
    expect(target).toContain("v=demo");
    expect(target).toContain("tag=a");
    expect(target).toContain("tag=b");
  });

  it("normalizes showcase aliases to the Claims Intake review workspace", async () => {
    redirect.mockClear();

    await expect(
      SnapshotPage({
        params: Promise.resolve({ runId: "claims-intake-modernization-run" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow(
      `redirect:/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}?readOnly=1`,
    );
  });
});
