import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPackDetailEvidenceChrome } from "@/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailEvidenceChrome";
import { ResponsibleAiPolicyPackDetail } from "@/app/(operator)/governance/policy-packs/[id]/ResponsibleAiPolicyPackDetail";
import { BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID } from "@/lib/policy/policy-pack-detail-resolver";
import {
  POLICY_PACK_DETAIL_BUYER_START_HERE_HELPER,
  POLICY_PACK_DETAIL_PAGE_LEAD,
  POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID,
  POLICY_PACK_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/policy/policy-pack-detail-page-copy";
import {
  POLICY_PACK_DETAIL_CLAIM_DISCIPLINE,
  POLICY_PACK_DETAIL_FOLLOW_UPS_TITLE,
} from "@/lib/policy/policy-pack-detail-evidence-copy";
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

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

describe("Policy pack detail buyer-polished chrome (GPI)", () => {
  it("renders skip link and primary content landmark in evidence chrome", () => {
    vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(true);

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
    expect(screen.getByTestId("governance-policy-pack-detail-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-policy-pack-detail-intro")).toHaveTextContent(POLICY_PACK_DETAIL_PAGE_LEAD);
    expect(screen.getByTestId("governance-policy-pack-detail-buyer-start-here-helper")).toHaveTextContent(
      POLICY_PACK_DETAIL_BUYER_START_HERE_HELPER,
    );
  });

  it("renders governance breadcrumb trail and orientation after pack body in buyer shell", () => {
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

    expect(screen.getByTestId("policy-pack-detail-claim-discipline").textContent).toContain(
      POLICY_PACK_DETAIL_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: POLICY_PACK_DETAIL_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primary = screen.getByTestId("policy-pack-detail-primary-content");
    const summaryCard = screen.getByTestId("policy-pack-summary-card");
    const orientationBottom = screen.getByTestId("policy-pack-detail-orientation-bottom");

    expect(primary).toContainElement(summaryCard);
    expect(primary).toContainElement(orientationBottom);
    expect(summaryCard.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
