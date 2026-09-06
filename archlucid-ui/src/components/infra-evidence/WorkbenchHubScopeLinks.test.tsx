import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";

describe("WorkbenchHubScopeLinks", () => {
  it("renders primary link, sibling nav landmark, and compact hub tabs", () => {
    render(
      <WorkbenchHubScopeLinks
        cloudResourceId="11111111-1111-1111-1111-111111111111"
        primaryTab="drift"
        primaryHref="/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift"
        primaryTestId="infra-drift-open-primary-hub"
        siblingTestIdPrefix="infra-drift"
        scopePatch={{ snapshotId: "22222222-2222-2222-2222-222222222222" }}
        siblingTabs={["findings", "terraform"]}
      />,
    );

    expect(screen.getByTestId("infra-drift-open-primary-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift",
    );
    expect(screen.getByRole("navigation", { name: "Related resource hub sections" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-open-findings-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });
});
