import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  COMPOSITE_ALERT_RULES_BUYER_START_HERE_HELPER,
  COMPOSITE_ALERT_RULES_PAGE_LEAD,
} from "@/lib/composite-alert-rules-copy";
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
  listCompositeAlertRules: vi.fn().mockResolvedValue([]),
  createCompositeAlertRule: vi.fn(),
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("tab=advanced-rules&runId=run-composite-test"),
}));

import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";

describe("CompositeAlertRulesContent buyer-polished shell (GOA)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first-viewport intro, hides rank cue and create CTAs, mounts tab Sources chrome", async () => {
    renderWithOperatorQuery(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("composite-alert-rules-first-viewport")).toBeInTheDocument();
    });

    expect(screen.getByTestId("composite-alert-rules-intro")).toHaveTextContent(COMPOSITE_ALERT_RULES_PAGE_LEAD);
    expect(screen.getByTestId("composite-alert-rules-buyer-start-here-helper")).toHaveTextContent(
      COMPOSITE_ALERT_RULES_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText("Writes below: API-enforced.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("composite-rules-create-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("composite-rules-empty-create-action")).not.toBeInTheDocument();
    expect(screen.getByTestId("composite-alert-rules-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("composite-alert-rules-sources")).toBeInTheDocument();
  });
});
