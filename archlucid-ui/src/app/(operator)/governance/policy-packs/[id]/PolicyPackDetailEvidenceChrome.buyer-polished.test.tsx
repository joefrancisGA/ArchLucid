import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPackDetailEvidenceChrome } from "@/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailEvidenceChrome";
import { ResponsibleAiPolicyPackDetail } from "@/app/(operator)/governance/policy-packs/[id]/ResponsibleAiPolicyPackDetail";
import { BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID } from "@/lib/policy/policy-pack-detail-resolver";
import {
  POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID,
  POLICY_PACK_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/policy/policy-pack-detail-page-copy";
import { POLICY_PACK_DETAIL_CLAIM_DISCIPLINE } from "@/lib/policy/policy-pack-detail-evidence-copy";
import * as demoUiEnv from "@/lib/demo-ui-env";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => null,
}));

describe("Policy pack detail buyer-polished chrome (GPI)", () => {
  it("renders skip link and primary content landmark in evidence chrome", () => {
    render(
      <PolicyPackDetailEvidenceChrome>
        <div>Pack body</div>
      </PolicyPackDetailEvidenceChrome>,
    );

    expect(screen.getByRole("link", { name: POLICY_PACK_DETAIL_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("policy-pack-detail-primary-content")).toHaveAttribute(
      "id",
      POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID,
    );
  });

  it("renders governance breadcrumb trail and orientation after header in buyer shell", () => {
    vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(true);

    render(
      <PolicyPackDetailEvidenceChrome>
        <ResponsibleAiPolicyPackDetail
          policyPackId={BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID}
          packRecord={null}
          packContent={null}
          isEnabled={false}
          isGloballyActive={false}
        />
      </PolicyPackDetailEvidenceChrome>,
    );

    expect(screen.getByRole("link", { name: "Approval" })).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByRole("link", { name: "Policy packs" })).toHaveAttribute("href", "/governance/policy-packs");
    expect(screen.getByTestId("policy-pack-detail-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-detail-claim-discipline").textContent).toContain(
      POLICY_PACK_DETAIL_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const title = screen.getByTestId("policy-pack-detail-title");
    const orientationTop = screen.getByTestId("policy-pack-detail-orientation-top");

    expect(title.compareDocumentPosition(orientationTop) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
