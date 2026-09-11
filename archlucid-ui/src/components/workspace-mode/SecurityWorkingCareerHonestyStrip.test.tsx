import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecurityWorkingCareerHonestyStrip } from "@/components/workspace-mode/SecurityWorkingCareerHonestyStrip";
import {
  SECURITY_WORKING_CAREER_HONESTY_STRIP_BODY,
  SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_LABEL,
  SECURITY_WORKING_CAREER_HONESTY_STRIP_TITLE,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import {
  SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_TEST_ID,
  SECURITY_WORKING_CAREER_HONESTY_STRIP_TEST_ID,
} from "@/lib/governance/security-working-career-honesty-strip";
import { WORKING_CAREER_REHEARSAL_HELP_SECURITY_HREF } from "@/lib/governance/working-career-rehearsal-help-route";

const productLineMock = vi.hoisted(() => ({ value: "security" as "architecture" | "security" }));
const buyerPolishedMock = vi.hoisted(() => ({ value: false }));
const workspaceModeMock = vi.hoisted(() => ({
  mode: "working" as "guided" | "working",
  mounted: true,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: productLineMock.value,
    assignmentOverrides: {},
    setProductLine: () => {},
    setHrefAssignment: () => {},
    resetHrefAssignment: () => {},
    resetAllAssignments: () => {},
  }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMock.mode,
    mounted: workspaceModeMock.mounted,
    accountSyncState: "synced",
    isWorkingMode: workspaceModeMock.mode === "working",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

describe("SecurityWorkingCareerHonestyStrip (CG-017)", () => {
  beforeEach(() => {
    productLineMock.value = "security";
    workspaceModeMock.mode = "working";
    workspaceModeMock.mounted = true;
    buyerPolishedMock.value = false;
  });

  it("labels Simulator as not Career and links help without a chooser", () => {
    render(<SecurityWorkingCareerHonestyStrip />);

    const strip = screen.getByTestId(SECURITY_WORKING_CAREER_HONESTY_STRIP_TEST_ID);

    expect(strip).toHaveTextContent(SECURITY_WORKING_CAREER_HONESTY_STRIP_TITLE);
    expect(strip.querySelector("[title]")).toHaveAttribute(
      "title",
      SECURITY_WORKING_CAREER_HONESTY_STRIP_BODY,
    );
    expect(screen.getByTestId(SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_TEST_ID)).toHaveAttribute(
      "href",
      WORKING_CAREER_REHEARSAL_HELP_SECURITY_HREF,
    );
    expect(screen.getByRole("link", { name: SECURITY_WORKING_CAREER_HONESTY_STRIP_HELP_LABEL })).toBeInTheDocument();
    expect(screen.queryByTestId("working-career-rehearsal-chooser")).not.toBeInTheDocument();
  });

  it("returns null on Architecture Working", () => {
    productLineMock.value = "architecture";

    const { container } = render(<SecurityWorkingCareerHonestyStrip />);

    expect(container).toBeEmptyDOMElement();
  });

  it("returns null on Guided Security", () => {
    workspaceModeMock.mode = "guided";

    const { container } = render(<SecurityWorkingCareerHonestyStrip />);

    expect(container).toBeEmptyDOMElement();
  });
});
