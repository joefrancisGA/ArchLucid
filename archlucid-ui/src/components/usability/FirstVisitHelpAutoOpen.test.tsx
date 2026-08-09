import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FirstVisitHelpAutoOpen } from "@/components/usability/FirstVisitHelpAutoOpen";

const fullShellMock = vi.hoisted(() => ({ value: false }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: () => fullShellMock.value,
  };
});

vi.mock("@/lib/usability/first-visit-help", () => ({
  firstVisitHelpSlugForPathname: () => "core-pilot",
  isFirstVisitHelpDismissed: () => false,
  isFirstVisitHelpSessionDone: () => false,
  dismissFirstVisitHelp: vi.fn(),
  markFirstVisitHelpSessionDone: vi.fn(),
}));

describe("FirstVisitHelpAutoOpen", () => {
  beforeEach(() => {
    fullShellMock.value = false;
  });

  it("shows the tip on buyer-default Overview", async () => {
    render(<FirstVisitHelpAutoOpen />);

    expect(await screen.findByTestId("first-visit-help-auto-open")).toBeInTheDocument();
    expect(screen.getByText(/3 things to know:/i)).toBeInTheDocument();
  });

  it("skips the tip on full architect workspace", () => {
    fullShellMock.value = true;

    render(<FirstVisitHelpAutoOpen />);

    expect(screen.queryByTestId("first-visit-help-auto-open")).toBeNull();
  });
});
