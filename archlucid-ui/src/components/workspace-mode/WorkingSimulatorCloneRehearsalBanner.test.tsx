import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import { WorkingSimulatorCloneRehearsalBanner } from "@/components/workspace-mode/WorkingSimulatorCloneRehearsalBanner";
import {
  WORKING_CAREER_REHEARSAL_HELP_LEARN_MORE_LABEL,
  WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY,
  WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import type { WorkingSimulatorCloneRehearsalChrome } from "@/lib/governance/working-simulator-clone-rehearsal-banner";

const chromeState = vi.hoisted(
  (): WorkingSimulatorCloneRehearsalChrome => ({
    hostPinnedSimulator: true,
    showBanner: true,
    effectiveDoor: "rehearsal",
    careerBlockedHonesty: false,
  }),
);

vi.mock("@/hooks/use-working-simulator-clone-rehearsal-banner", () => ({
  useWorkingSimulatorCloneRehearsalBanner: () => chromeState,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

const productLineMock = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineMock.value }),
}));

describe("WorkingSimulatorCloneRehearsalBanner", () => {
  beforeEach(() => {
    productLineMock.value = "architecture";
    chromeState.hostPinnedSimulator = true;
    chromeState.showBanner = true;
    chromeState.effectiveDoor = "rehearsal";
    chromeState.careerBlockedHonesty = false;
  });

  it("renders persistent rehearsal copy with a visible-boundary help button", () => {
    render(<WorkingSimulatorCloneRehearsalBanner />);

    expect(screen.getByTestId("working-simulator-clone-rehearsal-banner")).toBeInTheDocument();
    expect(screen.getByTestId("working-simulator-clone-rehearsal-banner")).toHaveAttribute(
      "data-effective-door",
      "rehearsal",
    );
    expect(screen.getByText(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE)).toBeInTheDocument();
    expect(screen.getByText(WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("working-simulator-clone-rehearsal-banner-help")).toHaveTextContent(
      WORKING_CAREER_REHEARSAL_HELP_LEARN_MORE_LABEL,
    );
  });

  it("hides when the resolver says the clone banner is off", () => {
    chromeState.showBanner = false;

    const { container } = render(<WorkingSimulatorCloneRehearsalBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("hides in the SecureNow shell even when the resolver would show the banner", () => {
    productLineMock.value = "security";

    const { container } = render(<WorkingSimulatorCloneRehearsalBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not auto-switch Guided from the banner module", () => {
    const uiRoot = join(process.cwd());
    const bannerSource = readFileSync(
      join(uiRoot, "src/components/workspace-mode/WorkingSimulatorCloneRehearsalBanner.tsx"),
      "utf8",
    );
    const hookSource = readFileSync(
      join(uiRoot, "src/hooks/use-working-simulator-clone-rehearsal-banner.ts"),
      "utf8",
    );

    expect(bannerSource).not.toContain("setAndPersist");
    expect(bannerSource).not.toContain("persistWorkspaceMode");
    expect(hookSource).not.toContain("setAndPersist");
    expect(hookSource).not.toContain("persistWorkspaceMode");
    expect(hookSource).not.toContain("AgentExecution:Mode");
  });
});
