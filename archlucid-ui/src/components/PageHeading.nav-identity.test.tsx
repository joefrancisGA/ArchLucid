import { render, screen } from "@testing-library/react";
import { CloudCog, Hash, Ticket, Workflow } from "lucide-react";
import { describe, expect, it } from "vitest";

import { PageHeading } from "@/components/PageHeading";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_AZURE_BOARDS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";
import { resolveNavIconForHref } from "@/lib/resolve-nav-link-for-pathname";
import { AZURE_BOARDS_SURFACE_ICON } from "@/lib/azure-boards-surface-icon";
import { TEAMS_SURFACE_ICON } from "@/lib/teams-surface-icon";
import { WEBHOOKS_SURFACE_ICON } from "@/lib/webhooks-surface-icon";

function expectSameIcon(navHref: string, expectedIcon: typeof CloudCog): void {
  const navIcon = resolveNavIconForHref(navHref);
  expect(navIcon).toBe(expectedIcon);

  render(<PageHeading navHref={navHref} title="Test page" data-testid="page-heading" />);
  expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
  expect(navIcon).toBe(expectedIcon);
}

describe("PageHeading nav identity", () => {
  it("uses the same icon definition as navigation for Webhooks", () => {
    expectSameIcon(INTEGRATIONS_WEBHOOKS_PATH, WEBHOOKS_SURFACE_ICON);
  });

  it("uses the same icon definition as navigation for Jira", () => {
    expectSameIcon(INTEGRATIONS_JIRA_PATH, Ticket);
  });

  it("uses the same icon definition as navigation for Azure Boards", () => {
    expectSameIcon(INTEGRATIONS_AZURE_BOARDS_PATH, AZURE_BOARDS_SURFACE_ICON);
  });

  it("uses the same icon definition as navigation for ServiceNow", () => {
    expectSameIcon(INTEGRATIONS_SERVICENOW_PATH, Workflow);
  });

  it("uses the same icon definition as navigation for Microsoft Teams", () => {
    expectSameIcon(INTEGRATIONS_TEAMS_PATH, TEAMS_SURFACE_ICON);
  });

  it("uses the same icon definition as navigation for Slack", () => {
    expectSameIcon(INTEGRATIONS_SLACK_PATH, Hash);
  });

  it("uses the same icon definition as navigation for Cloud connections", () => {
    expectSameIcon(CLOUD_CONNECTIONS_PATH, CloudCog);
  });

  it("renders representative Insights, Governance, and Administration headings from nav identity", () => {
    for (const [navHref, testId] of [
      ["/insights/evidence-graph", "insights-heading"],
      ["/governance/approval-queue", "governance-heading"],
      ["/administration/users", "admin-heading"],
    ] as const) {
      render(<PageHeading navHref={navHref} title="Representative page" data-testid={testId} />);
      expect(screen.getByTestId(`${testId}`).querySelector('[data-testid="page-heading-icon"]')).toBeInTheDocument();
      expect(resolveNavIconForHref(navHref)).toBeDefined();
    }
  });

  it("keeps the icon decorative for screen readers", () => {
    render(<PageHeading navHref={INTEGRATIONS_WEBHOOKS_PATH} title="Webhooks" />);
    expect(screen.getByRole("heading", { name: "Webhooks" })).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("wraps long titles without losing the icon", () => {
    render(
      <PageHeading
        navHref={INTEGRATIONS_JIRA_PATH}
        title="Jira integration for architecture governance alert routing and work item creation"
        className="max-w-xs"
      />,
    );

    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Jira integration/);
  });

  it("renders integration variant with icon tile", () => {
    render(
      <PageHeading
        navHref={INTEGRATIONS_WEBHOOKS_PATH}
        title="Webhooks"
        variant="integration"
      />,
    );

    expect(screen.getByTestId("page-heading-icon-tile")).toBeInTheDocument();
  });

  it("delegates nav identity from OperatorPageHeader", () => {
    render(<OperatorPageHeader navHref="/insights/evidence-graph" title="Evidence graph" subtitle="Trace evidence" />);
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(resolveNavIconForHref("/insights/evidence-graph")).toBeDefined();
  });

  it("uses the help topic book icon for in-app help routes without nav identity", () => {
    render(<PageHeading navHref="/help/cloud-connections" title="Cloud connections" />);

    expect(resolveNavIconForHref("/help/cloud-connections")).toBeUndefined();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
  });
});
