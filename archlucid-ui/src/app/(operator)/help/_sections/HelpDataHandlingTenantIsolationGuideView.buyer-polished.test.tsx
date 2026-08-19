import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/data-handling",
}));

import { HelpDataHandlingTenantIsolationGuideView } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationGuideView";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE_BUYER,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_CONTENT_ID,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SKIP_LINK_LABEL,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpDataHandlingTenantIsolationGuideView buyer-polished shell", () => {
  const loaded = tryLoadProductDocumentation("data-handling");

  it("renders skip link, buyer subtitle, orientation above overview, and hides operator chrome", () => {
    if (loaded === null) {
      throw new Error("Expected data-handling documentation to load.");
    }

    render(<HelpDataHandlingTenantIsolationGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: DATA_HANDLING_TENANT_ISOLATION_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-data-handling-tenant-isolation-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-data-handling-claim-discipline").textContent).toContain(
      DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-data-handling-tenant-isolation-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-data-handling-tenant-isolation-related")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-data-handling-tenant-isolation-source-disclosure")).not.toBeInTheDocument();

    const primaryContent = document.getElementById(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_CONTENT_ID);

    expect(primaryContent).not.toBeNull();

    const orderedLandmarks = within(primaryContent as HTMLElement)
      .getAllByTestId(/help-data-handling-tenant-isolation-(orientation-top|overview)/)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual([
      "help-data-handling-tenant-isolation-orientation-top",
      "help-data-handling-tenant-isolation-overview",
    ]);
  });
});
