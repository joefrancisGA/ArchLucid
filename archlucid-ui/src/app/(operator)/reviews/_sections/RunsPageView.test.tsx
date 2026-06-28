import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BUYER_RUNS_LIST_MALFORMED_BODY,
  BUYER_RUNS_LIST_MALFORMED_HEADING,
} from "@/lib/buyer-polish-copy";

import { RunsPageView } from "./RunsPageView";
import type { RunsPageModel } from "./runs-page-model";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/OperatorPageHeader", () => ({
  OperatorPageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/FirstWeekRouteGuidance", () => ({
  FirstWeekRouteGuidance: () => null,
}));

vi.mock("@/components/RunsPageBuyerHelpTip", () => ({
  RunsPageBuyerHelpTip: () => null,
}));

vi.mock("@/components/GlossaryTooltip", () => ({
  GlossaryTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/RunsListProofHeadline", () => ({
  RunsListProofHeadline: () => null,
}));

vi.mock("@/components/BeforeAfterDeltaPanel", () => ({
  BeforeAfterDeltaPanel: () => null,
}));

vi.mock("@/components/RunsIndexBeforeAfterPanel", () => ({
  RunsIndexBeforeAfterPanel: () => null,
}));

vi.mock("@/components/RunsListEmptyState", () => ({
  RunsListEmptyState: () => null,
}));

vi.mock("@/components/RunsListAggregateErrorBoundary", () => ({
  RunsListAggregateErrorBoundary: () => null,
}));

vi.mock("@/components/OperatorDemoStaticBanner", () => ({
  OperatorDemoStaticBanner: () => null,
}));

vi.mock("@/components/ShortcutHint", () => ({
  ShortcutHint: () => null,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
  isBuyerSafeDemoMarketingChromeEnv: () => false,
}));

function baseModel(overrides: Partial<RunsPageModel> = {}): RunsPageModel {
  return {
    projectId: "default",
    page: 1,
    pageSize: 25,
    runs: [],
    totalCount: 0,
    loadFailure: null,
    malformedMessage: null,
    usedStaticRunsFallback: false,
    nextCursorForClient: null,
    projectTitle: "Default project",
    firstCommittedRunId: null,
    welcomeOnboardingEligible: false,
    ...overrides,
  };
}

describe("RunsPageView malformed response", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("shows buyer-safe copy in production when the reviews list response is malformed", () => {
    process.env.NODE_ENV = "production";

    render(
      <RunsPageView
        model={baseModel({
          malformedMessage: "Expected array at items[] but received object.",
        })}
      />,
    );

    expect(screen.getByText(BUYER_RUNS_LIST_MALFORMED_HEADING)).toBeInTheDocument();
    expect(screen.getByText(BUYER_RUNS_LIST_MALFORMED_BODY)).toBeInTheDocument();
    expect(screen.queryByText(/Expected array at items/)).not.toBeInTheDocument();
    expect(screen.queryByText(/expected paged review summary shape/i)).not.toBeInTheDocument();
  });

  it("shows developer diagnostics in development when the reviews list response is malformed", () => {
    process.env.NODE_ENV = "development";

    const diagnostic = "Expected array at items[] but received object.";

    render(
      <RunsPageView
        model={baseModel({
          malformedMessage: diagnostic,
        })}
      />,
    );

    expect(screen.getByText(diagnostic)).toBeInTheDocument();
    expect(screen.getByText(/expected paged review summary shape/i)).toBeInTheDocument();
  });
});
