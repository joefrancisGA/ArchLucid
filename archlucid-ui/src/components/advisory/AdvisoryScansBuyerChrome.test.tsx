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

import { AdvisoryScansBuyerChrome } from "@/components/advisory/AdvisoryScansBuyerChrome";

describe("AdvisoryScansBuyerChrome", () => {
  it("renders claim discipline and Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<AdvisoryScansBuyerChrome />);

    expect(screen.getByTestId("advisory-scans-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<AdvisoryScansBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
