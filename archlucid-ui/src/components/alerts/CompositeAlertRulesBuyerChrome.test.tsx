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

import { CompositeAlertRulesBuyerChrome } from "@/components/alerts/CompositeAlertRulesBuyerChrome";

describe("CompositeAlertRulesBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<CompositeAlertRulesBuyerChrome />);

    expect(screen.getByTestId("composite-alert-rules-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("composite-alert-rules-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<CompositeAlertRulesBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
