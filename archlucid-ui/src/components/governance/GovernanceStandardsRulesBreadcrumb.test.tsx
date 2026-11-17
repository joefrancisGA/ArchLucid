import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceStandardsRulesBreadcrumb } from "./GovernanceStandardsRulesBreadcrumb";

describe("GovernanceStandardsRulesBreadcrumb", () => {
  it("does not render breadcrumbs after TB-2090 removal", () => {
    const { container } = render(<GovernanceStandardsRulesBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("governance-standards-rules-breadcrumb")).toBeNull();
  });
});
