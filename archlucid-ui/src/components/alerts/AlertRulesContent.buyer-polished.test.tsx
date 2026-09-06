import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER,
  ALERT_RULES_CONDITIONS_PAGE_LEAD,
} from "@/lib/alert-rule-conditions-copy";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
  isOperatorExperienceFullShellEnv: () => false,
}));

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
    expect(screen.getByTestId("alert-rules-conditions-buyer-start-here-helper")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText("Writes below: API-enforced.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alert-rules-create-action")).not.toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-conditions-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-conditions-sources")).toBeInTheDocument();
  });
});
