import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SocraticIntakeWizardGuards } from "./SocraticIntakeWizardGuards";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

describe("SocraticIntakeWizardGuards (LW-075)", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/architecture/reviews/new");
  });

  it("does not render a leave dialog for an empty new wizard", () => {
    render(
      <SocraticIntakeWizardGuards
        answers={{}}
        businessOutcome=""
        draftId={null}
        freeTextIntent=""
        isSubmitBlocked={false}
        step={0}
        systemName=""
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
