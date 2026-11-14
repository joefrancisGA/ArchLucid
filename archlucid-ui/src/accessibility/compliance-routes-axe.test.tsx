import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueBreadcrumb } from "@/components/governance/findings/GovernanceFindingsQueueBreadcrumb";
import { SecureNowFindingsQueueOpenGateStrip } from "@/components/governance/findings/SecureNowFindingsQueueOpenGateStrip";
import { SECURENOW_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

expect.extend(toHaveNoViolations);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("compliance routes axe", () => {
  it("findings queue breadcrumb has no detectable violations", async () => {
    const { container } = render(<GovernanceFindingsQueueBreadcrumb productLine="security" />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it("findings queue open-gate strip has no detectable violations", async () => {
    const { container } = render(
      <SecureNowFindingsQueueOpenGateStrip
        openGates={[
          {
            id: "open-findings",
            message: "Open findings still need triage or disposition.",
            ctaLabel: "Show open findings",
            href: `${SECURENOW_FINDINGS_PATH}?filter=open`,
          },
        ]}
      />,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
