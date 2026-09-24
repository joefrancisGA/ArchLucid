import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewWorkspaceMoreTabsMenu } from "@/components/reviews/ReviewWorkspaceMoreTabsMenu";

const commitHrefIfChanged = vi.hoisted(() => vi.fn(() => false));

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    commitHrefIfChanged,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/demo-run-id",
}));

describe("ReviewWorkspaceMoreTabsMenu", () => {
  beforeEach(() => {
    commitHrefIfChanged.mockClear();
    window.history.replaceState(null, "", "/architecture/reviews/demo-run-id");
  });

  it("does not commit href churn when the menu mounts closed", async () => {
    render(
      <ReviewWorkspaceMoreTabsMenu
        lifecycle="in_review"
        moreTabIds={["evidence", "activity"]}
        activeTab="overview"
        onTabChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(commitHrefIfChanged).not.toHaveBeenCalled();
    });
  });
});
