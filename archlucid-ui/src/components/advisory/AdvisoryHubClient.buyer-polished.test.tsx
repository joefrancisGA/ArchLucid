import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
  fullShell: false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
    isOperatorExperienceFullShellEnv: () => demoEnvMock.fullShell,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/governance/advisory-scans",
  useSearchParams: () => new URLSearchParams("tab=schedules"),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("./AdvisoryScansContent", () => ({
  AdvisoryScansContent: () => <div data-testid="advisory-scans-panel" />,
}));

vi.mock("./AdvisorySchedulesContent", () => ({
  AdvisorySchedulesContent: () => <div data-testid="advisory-schedules-panel" />,
}));

import { AdvisoryHubClient } from "./AdvisoryHubClient";
import {
  ADVISORY_HUB_PRIMARY_CONTENT_ID,
  ADVISORY_HUB_SKIP_LINK_LABEL,
  ADVISORY_HUB_SKIP_TARGET_ID,
} from "@/lib/advisory-hub-page-copy";
import { ADVISORY_SCANS_PAGE_LEAD, ADVISORY_SCANS_PAGE_LEAD_BUYER } from "@/lib/advisory-copy";

describe("AdvisoryHubClient buyer-polished shell (AD)", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = true;
    demoEnvMock.fullShell = false;
  });

  it("renders skip link, buyer page lead, and hides contextual help", () => {
    render(<AdvisoryHubClient initialTab="schedules" />);

    expect(screen.getByRole("link", { name: ADVISORY_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ADVISORY_HUB_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("advisory-scans-page-lead")).toHaveTextContent(ADVISORY_SCANS_PAGE_LEAD_BUYER);
    expect(screen.queryByText(ADVISORY_SCANS_PAGE_LEAD)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId(ADVISORY_HUB_PRIMARY_CONTENT_ID)).toContainElement(
      screen.getByTestId(ADVISORY_HUB_SKIP_TARGET_ID),
    );
    expect(screen.getByTestId("advisory-schedules-panel")).toBeInTheDocument();
  });
});
