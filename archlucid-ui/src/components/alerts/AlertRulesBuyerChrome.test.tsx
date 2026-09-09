import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

import { AlertRulesBuyerChrome } from "@/components/alerts/AlertRulesBuyerChrome";
import {
  ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE,
  ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID,
} from "@/lib/alert-rules-conditions-evidence-copy";

describe("AlertRulesBuyerChrome", () => {
  it("renders claim discipline and Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<AlertRulesBuyerChrome />);

    expect(screen.getByTestId(ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-conditions-claim-discipline")).toHaveTextContent(
      ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("alert-rules-conditions-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<AlertRulesBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
