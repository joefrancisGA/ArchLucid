import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const mockSearchParams = vi.hoisted(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/proxy-timeout-real-execute",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

import { HelpProxyTimeoutRealExecuteGuideView } from "@/app/(operator)/help/_sections/HelpProxyTimeoutRealExecuteGuideView";
import {
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_DISCIPLINE,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_HEADINGS,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HELP_RETURN,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PAGE_SUBTITLE,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE,
} from "@/lib/daytime-wait-help-proxy-timeout-guide-content";
import {
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_LINK_LABEL,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_TARGET_ID,
} from "@/lib/daytime-wait-help-proxy-timeout-page-copy";
import { DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RETURN_TO_REVIEW_LABEL } from "@/lib/daytime-wait-help-proxy-timeout-return";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpProxyTimeoutRealExecuteGuideView (DW-007 / EPX Phase 2)", () => {
  const entry = getProductDocumentationEntry("proxy-timeout-real-execute");

  it("renders claim discipline, error recovery, keyboard hints, and related topics", () => {
    if (entry === undefined) {
      throw new Error("Expected proxy-timeout-real-execute documentation entry.");
    }

    render(<HelpProxyTimeoutRealExecuteGuideView entry={entry} />);

    expect(screen.getByTestId("help-proxy-timeout-real-execute-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-proxy-timeout-real-execute-page-title")).toHaveTextContent(
      DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE,
    );
    expect(screen.getByText(DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toBeInTheDocument();
    expect(screen.getByTestId("help-proxy-timeout-real-execute-header-claim-discipline")).toHaveTextContent(
      DAYTIME_WAIT_HELP_PROXY_TIMEOUT_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-proxy-timeout-real-execute-overview").className).toContain(
      HELP_PAGE_LAYOUT.readingBody,
    );
    expect(screen.queryByTestId("help-proxy-timeout-real-execute-honesty-panel")).not.toBeInTheDocument();

    for (const heading of DAYTIME_WAIT_HELP_PROXY_TIMEOUT_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: heading.level, name: heading.title })).toHaveAttribute(
        "id",
        heading.id,
      );
    }

    expect(screen.getByTestId("help-proxy-timeout-error-recovery")).toHaveTextContent("operations");
    expect(screen.getByTestId("help-proxy-timeout-keyboard")).toBeInTheDocument();
    expect(screen.getByTestId("help-proxy-timeout-return-to-help")).toHaveAttribute(
      "href",
      DAYTIME_WAIT_HELP_PROXY_TIMEOUT_HELP_RETURN.href,
    );
  });

  it("renders Back to review when returnTo targets a review route", () => {
    if (entry === undefined) {
      throw new Error("Expected proxy-timeout-real-execute documentation entry.");
    }

    mockSearchParams.set("returnTo", "/architecture/reviews/run-42?tab=activity");
    render(<HelpProxyTimeoutRealExecuteGuideView entry={entry} />);

    expect(screen.getByTestId("help-proxy-timeout-real-execute-return-to-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-42?tab=activity",
    );
    expect(screen.getByTestId("help-proxy-timeout-real-execute-return-to-review")).toHaveTextContent(
      DAYTIME_WAIT_HELP_PROXY_TIMEOUT_RETURN_TO_REVIEW_LABEL,
    );

    mockSearchParams.delete("returnTo");
  });
});
