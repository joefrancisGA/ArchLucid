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

import { AlertTestAlertsBuyerChrome } from "@/components/alerts/AlertTestAlertsBuyerChrome";

describe("AlertTestAlertsBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<AlertTestAlertsBuyerChrome />);

    expect(screen.getByTestId("alert-test-alerts-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("alert-test-alerts-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<AlertTestAlertsBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
