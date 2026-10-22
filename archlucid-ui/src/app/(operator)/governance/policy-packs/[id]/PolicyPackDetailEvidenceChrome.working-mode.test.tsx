import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: (): boolean => false,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import {
  POLICY_PACK_DETAIL_PRIMARY_CONTENT_ID,
  POLICY_PACK_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/policy/policy-pack-detail-page-copy";
import { PolicyPackDetailEvidenceChrome } from "./PolicyPackDetailEvidenceChrome";

describe("PolicyPackDetailEvidenceChrome working mode", () => {
  it("renders skip link and claim orientation strip without buyer intro chrome", () => {
    render(
      <PolicyPackDetailEvidenceChrome>
        <p>Pack body</p>
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
    expect(screen.getByTestId("policy-pack-detail-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-policy-pack-detail-first-viewport")).not.toBeInTheDocument();
  });
});
