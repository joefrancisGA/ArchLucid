import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  ALERT_RULES_CONDITIONS_BUYER_OVERVIEW,
  ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER,
  ALERT_RULES_CONDITIONS_PAGE_LEAD,
} from "@/lib/alert-rule-conditions-copy";
import {
  ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE,
  ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE,
  ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID,
  ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES,
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

vi.mock("@/components/alerts/AlertRulesPickReviewBeforeCreatingStrip", () => ({
  AlertRulesPickReviewBeforeCreatingStrip: () => (
    <div data-testid="alert-rules-pick-review-before-creating-strip" />
  ),
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

    const content = screen.getByTestId("alert-rules-conditions-content");
    const firstViewport = screen.getByTestId("alert-rules-conditions-first-viewport");
    const overview = screen.getByTestId("alert-rules-conditions-overview");
    const existingSection = screen.getByTestId("alert-rules-conditions-existing");
    const orientationBottom = screen.getByTestId(ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("alert-rules-conditions-sources");

    expect(screen.getByTestId("alert-rules-conditions-intro")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_PAGE_LEAD,
    );
    expect(overview).toHaveTextContent(ALERT_RULES_CONDITIONS_BUYER_OVERVIEW);
    expect(content).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(screen.getByTestId("alert-rules-conditions-intro"));
    expect(content).toContainElement(overview);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("alert-rules-conditions-buyer-start-here-helper")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText("Writes below: API-enforced.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-create-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-pick-review-before-creating-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-conditions-claim-discipline")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    expect(content).toContainElement(existingSection);
    expect(content).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(overview.compareDocumentPosition(existingSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(existingSection.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
