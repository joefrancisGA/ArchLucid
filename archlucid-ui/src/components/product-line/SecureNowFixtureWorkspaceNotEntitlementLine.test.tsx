import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";

describe("SecureNowFixtureWorkspaceNotEntitlementLine", () => {
  it("names a fixture workspace as not an SN-EVAL or annual entitlement", () => {
    render(<SecureNowFixtureWorkspaceNotEntitlementLine fixtureWorkspace />);

    expect(screen.getByTestId("securenow-fixture-workspace-not-entitlement")).toHaveTextContent(
      "not an SN-EVAL evaluation or an SN-ANNUAL entitlement",
    );
  });

  it("stays hidden when the session is not a fixture", () => {
    render(<SecureNowFixtureWorkspaceNotEntitlementLine fixtureWorkspace={false} />);

    expect(screen.queryByTestId("securenow-fixture-workspace-not-entitlement")).not.toBeInTheDocument();
  });
});
