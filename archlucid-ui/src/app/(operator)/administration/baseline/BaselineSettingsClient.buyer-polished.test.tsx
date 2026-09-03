import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { BaselineSettingsClient } from "@/app/(operator)/administration/baseline/BaselineSettingsClient";
import {
  BASELINE_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  BASELINE_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  BASELINE_SETTINGS_PAGE_SUBTITLE_BUYER,
  BASELINE_SETTINGS_PRIMARY_CONTENT_ID,
  BASELINE_SETTINGS_SKIP_LINK_LABEL,
  BASELINE_SETTINGS_SKIP_TARGET_ID,
} from "@/lib/baseline-settings-page-copy";
import {
  BASELINE_SETTINGS_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_SOURCES,
} from "@/lib/baseline-settings-evidence-copy";
import { BASELINE_SETTINGS_PAGE_SUBTITLE, BASELINE_SETTINGS_PAGE_TITLE } from "@/lib/baseline-settings-present";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

const emptyBaseline = {
  manualPrepHoursPerReview: null,
  peoplePerReview: null,
  capturedUtc: null,
  baselineReviewCycleHours: null,
  baselineReviewCycleSource: null,
  baselineReviewCycleCapturedUtc: null,
};

function createFetchMock(): ReturnType<typeof vi.fn> {
  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    if (String(input).endsWith("/api/proxy/v1/tenant/baseline") && (!init || init.method === "GET" || !init.method)) {
      return new Response(JSON.stringify(emptyBaseline), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("BaselineSettingsClient buyer-polished shell (ADA)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createFetchMock());
  });

  it("renders skip link, baseline form before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<BaselineSettingsClient />);

    expect(screen.getByRole("link", { name: BASELINE_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${BASELINE_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(BASELINE_SETTINGS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(BASELINE_SETTINGS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(BASELINE_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      BASELINE_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("baseline-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("baseline-roi-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: BASELINE_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: BASELINE_SETTINGS_PAGE_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(BASELINE_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(BASELINE_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("baseline-settings-orientation-bottom");
    const sourcesSection = screen.getByTestId("baseline-settings-sources");
    const summary = await screen.findByTestId("baseline-settings-summary");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(summary);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(BASELINE_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    vi.unstubAllGlobals();
  });
});
