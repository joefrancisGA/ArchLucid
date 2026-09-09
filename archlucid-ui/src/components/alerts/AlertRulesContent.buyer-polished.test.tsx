import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER,
  ALERT_RULES_CONDITIONS_OVERVIEW,
  ALERT_RULES_CONDITIONS_PAGE_LEAD,
} from "@/lib/alert-rule-conditions-copy";
import {
  ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE,
  ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE,
  ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID,
} from "@/lib/alert-rules-conditions-evidence-copy";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

vi.mock("@/lib/api", () => ({
  listAlertRules: vi.fn().mockResolvedValue([]),
  listAlertRoutingSubscriptions: vi.fn().mockResolvedValue([]),
  createAlertRule: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";

describe("AlertRulesContent buyer-polished shell (GLR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first-viewport intro, hides rank cue and create CTA, mounts tab Sources chrome", async () => {
    renderWithOperatorQuery(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-rules-conditions-first-viewport")).toBeInTheDocument();
    });

    expect(screen.getByTestId("alert-rules-conditions-intro")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_PAGE_LEAD,
    );
    expect(screen.getByTestId("alert-rules-conditions-overview")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_OVERVIEW,
    );
    expect(screen.getByTestId("alert-rules-conditions-first-viewport")).toContainElement(
      screen.getByTestId("alert-rules-conditions-intro"),
    );
    expect(
      screen.getByTestId("alert-rules-conditions-first-viewport").compareDocumentPosition(
        screen.getByTestId("alert-rules-conditions-overview"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByTestId("alert-rules-conditions-buyer-start-here-helper")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText("Writes below: API-enforced.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-create-action")).not.toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-conditions-claim-discipline")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId(ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-conditions-sources")).toBeInTheDocument();

    const layout = screen.getByTestId("alert-rules-layout");
    const orientationBottom = screen.getByTestId(ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID);

    expect(layout.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
