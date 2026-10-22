import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

import { HealthcareClaimsPolicyPackDetail } from "./HealthcareClaimsPolicyPackDetail";

describe("HealthcareClaimsPolicyPackDetail", () => {
  it("shows workspace enablement and published rules when pack is not enabled", () => {
    render(
      <HealthcareClaimsPolicyPackDetail
        policyPackId="healthcare-claims-v3"
        packRecord={null}
        packContent={null}
        isEnabled={false}
        isGloballyActive={false}
      />,
    );

    expect(screen.getByTestId("policy-pack-workspace-enablement")).toHaveTextContent("Not enabled in workspace");
    expect(screen.getByRole("heading", { name: /Published rules/i })).toBeInTheDocument();
    expect(screen.getByTestId("healthcare-claims-policy-pack-rules-table")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open approval queue" })).toHaveAttribute("href", "/governance/approval-queue");
  });
});
