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
import { ADVISORY_SCHEDULES_CLAIM_DISCIPLINE } from "@/lib/advisory-schedules-evidence-copy";

describe("AdvisorySchedulesBuyerChrome", () => {
  it("renders claim discipline and Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<AdvisorySchedulesBuyerChrome />);

    expect(screen.getByTestId("advisory-schedules-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-claim-discipline")).toHaveTextContent(
      ADVISORY_SCHEDULES_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("advisory-schedules-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<AdvisorySchedulesBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
