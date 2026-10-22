import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

function stubFetchWithEmptyTokens(): void {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
      return new Response(JSON.stringify({ tokens: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);
}

import { ScimProvisioningSettingsPageClient } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient";
import {
  SCIM_PROVISIONING_CLAIM_DISCIPLINE,
  SCIM_PROVISIONING_FOLLOW_UPS_TITLE,
  SCIM_PROVISIONING_SOURCES,
} from "@/lib/scim-provisioning-evidence-copy";
import {
  SCIM_PROVISIONING_FIRST_VIEWPORT_TEST_ID,
  SCIM_PROVISIONING_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SCIM_PROVISIONING_PAGE_SUBTITLE_BUYER,
  SCIM_PROVISIONING_PAGE_SUBTITLE_OPERATOR,
  SCIM_PROVISIONING_PRIMARY_CONTENT_ID,
  SCIM_PROVISIONING_SKIP_LINK_LABEL,
  SCIM_PROVISIONING_SKIP_TARGET_ID,
  SCIM_PROVISIONING_BUYER_START_HERE_HELPER,
  SCIM_PROVISIONING_PAGE_LEAD,
  SCIM_PROVISIONING_START_HERE_CARD_TITLE,
} from "@/lib/scim-provisioning-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ScimProvisioningSettingsPageClient buyer-polished shell (ASC)", () => {
  it("renders skip link, tokens before follow-ups, header claim discipline, and hides mutation chrome", async () => {
    stubFetchWithEmptyTokens();

    render(<ScimProvisioningSettingsPageClient />);

    expect(screen.getByRole("link", { name: SCIM_PROVISIONING_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SCIM_PROVISIONING_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SCIM_PROVISIONING_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SCIM_PROVISIONING_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByTestId("scim-provisioning-intro")).toHaveTextContent(SCIM_PROVISIONING_PAGE_LEAD);
    expect(screen.getByTestId("scim-provisioning-buyer-start-here-helper")).toHaveTextContent(
      SCIM_PROVISIONING_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: SCIM_PROVISIONING_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("scim-configure-section")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scim-create-token")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Page help" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("scim-identity-providers-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId(SCIM_PROVISIONING_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SCIM_PROVISIONING_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("scim-provisioning-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SCIM_PROVISIONING_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(SCIM_PROVISIONING_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SCIM_PROVISIONING_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("scim-provisioning-orientation-bottom");
    const sourcesSection = screen.getByTestId("scim-provisioning-settings-sources");
    const tokensSection = screen.getByTestId("scim-active-tokens-section");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(tokensSection);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(SCIM_PROVISIONING_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
