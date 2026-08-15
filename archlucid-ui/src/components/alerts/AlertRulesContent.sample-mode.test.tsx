import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ALERT_RULES_SAMPLE_MODE_BANNER } from "@/lib/alert-rule-conditions-copy";
import { alertRulesCreateButtonLabelReaderRank } from "@/lib/enterprise-controls-context-copy";
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

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";

describe("AlertRulesContent sample mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows sample workspace banner and disables create", async () => {
    renderWithOperatorQuery(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByText(ALERT_RULES_SAMPLE_MODE_BANNER)).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: alertRulesCreateButtonLabelReaderRank })).not.toBeInTheDocument();
  });
});
