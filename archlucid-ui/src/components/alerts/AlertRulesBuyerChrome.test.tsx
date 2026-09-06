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

describe("AlertRulesBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<AlertRulesBuyerChrome />);

    expect(screen.getByTestId("alert-rules-conditions-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-conditions-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<AlertRulesBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
