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

import { AdvisorySchedulesBuyerChrome } from "@/components/advisory/AdvisorySchedulesBuyerChrome";

describe("AdvisorySchedulesBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<AdvisorySchedulesBuyerChrome />);

    expect(screen.getByTestId("advisory-schedules-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<AdvisorySchedulesBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
