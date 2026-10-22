import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HAS_SEEN_ONBOARDING_STORAGE_KEY } from "@/lib/operator/operator-welcome-onboarding-storage";

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
  replace: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({ replace: navigationMock.replace }),
  useSearchParams: () => new URLSearchParams(navigationMock.search),
}));

vi.mock("@/hooks/use-runs-by-project-paged-query", () => ({
  useRunsByProjectPagedQuery: () => ({ isSuccess: false, data: undefined }),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

vi.mock("@/components/ui/welcome-modal", () => ({
  WelcomeModal: (props: { readonly open: boolean }) =>
    props.open ? <div data-testid="welcome-modal" /> : null,
}));

vi.mock("@/lib/operator/operator-onboarding-coordination", () => ({
  setWelcomeModalVisible: vi.fn(),
  WELCOME_MODAL_TOUR_START_DELAY_MS: 0,
}));

import { OperatorWelcomeOnboarding } from "@/components/operator/OperatorWelcomeOnboarding";

describe("OperatorWelcomeOnboarding", () => {
  beforeEach(() => {
    window.localStorage.removeItem(HAS_SEEN_ONBOARDING_STORAGE_KEY);
    navigationMock.pathname = "/";
    navigationMock.search = "";
    navigationMock.replace.mockClear();
  });

  it("writes welcomeOpen once when serverEligible opens the modal", () => {
    const { rerender } = render(<OperatorWelcomeOnboarding serverEligible />);

    expect(navigationMock.replace).toHaveBeenCalledTimes(1);
    expect(navigationMock.replace).toHaveBeenCalledWith("/?welcomeOpen=1", { scroll: false });

    rerender(<OperatorWelcomeOnboarding serverEligible />);

    expect(navigationMock.replace).toHaveBeenCalledTimes(1);
  });

  it("does not router.replace when welcomeOpen is already in the query", () => {
    navigationMock.search = "welcomeOpen=1";

    const { rerender } = render(<OperatorWelcomeOnboarding serverEligible />);

    expect(navigationMock.replace).not.toHaveBeenCalled();

    rerender(<OperatorWelcomeOnboarding serverEligible />);

    expect(navigationMock.replace).not.toHaveBeenCalled();
  });
});
