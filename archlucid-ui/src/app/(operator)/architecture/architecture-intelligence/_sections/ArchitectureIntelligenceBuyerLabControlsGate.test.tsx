import { render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";

const fullShellMock = vi.hoisted(() => ({
  enabled: false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: (): boolean => fullShellMock.enabled,
  };
});

import { ArchitectureIntelligenceBuyerLabControlsGate } from "./ArchitectureIntelligenceBuyerLabControlsGate";

function LabControlButtons() {
  return (
    <>
      <button type="button" data-testid="architecture-intelligence-golden-test-button">
        Run golden test
      </button>
      <button type="button" data-testid="architecture-intelligence-load-fixture-button">
        Load golden fixture
      </button>
      <button type="button" data-testid="architecture-intelligence-publish-button">
        Publish
      </button>
    </>
  );
}

function LateMountedLabControlButtons() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <button type="button" data-testid="architecture-intelligence-publish-button">Publish</button>;
  }

  return <LabControlButtons />;
}

describe("ArchitectureIntelligenceBuyerLabControlsGate", () => {
  it("hides golden-test and fixture controls on the buyer shell", () => {
    fullShellMock.enabled = false;

    render(
      <ArchitectureIntelligenceBuyerLabControlsGate>
        <LabControlButtons />
      </ArchitectureIntelligenceBuyerLabControlsGate>,
    );

    expect(screen.getByTestId("architecture-intelligence-golden-test-button")).not.toBeVisible();
    expect(screen.getByTestId("architecture-intelligence-load-fixture-button")).not.toBeVisible();
    expect(screen.getByTestId("architecture-intelligence-publish-button")).toBeVisible();
  });

  it("keeps golden-test and fixture controls visible in full operator chrome", () => {
    fullShellMock.enabled = true;

    render(
      <ArchitectureIntelligenceBuyerLabControlsGate>
        <LabControlButtons />
      </ArchitectureIntelligenceBuyerLabControlsGate>,
    );

    expect(screen.getByTestId("architecture-intelligence-golden-test-button")).toBeVisible();
    expect(screen.getByTestId("architecture-intelligence-load-fixture-button")).toBeVisible();
    expect(screen.getByTestId("architecture-intelligence-publish-button")).toBeVisible();
  });

  it("hides lab controls that mount after the first paint", async () => {
    fullShellMock.enabled = false;

    render(
      <ArchitectureIntelligenceBuyerLabControlsGate>
        <LateMountedLabControlButtons />
      </ArchitectureIntelligenceBuyerLabControlsGate>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-golden-test-button")).not.toBeVisible();
    });

    expect(screen.getByTestId("architecture-intelligence-load-fixture-button")).not.toBeVisible();
    expect(screen.getByTestId("architecture-intelligence-publish-button")).toBeVisible();
  });
});
