import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_BUYER_HIDDEN_LAB_CONTROL_TEST_IDS,
  hideArchitectureIntelligenceBuyerLabControls,
} from "./architecture-intelligence-buyer-lab-controls";

describe("hideArchitectureIntelligenceBuyerLabControls", () => {
  it("hides the golden-test and fixture buttons and leaves other controls visible", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <button data-testid="architecture-intelligence-golden-test-button">Run golden test</button>
      <button data-testid="architecture-intelligence-load-fixture-button">Load golden fixture</button>
      <button data-testid="architecture-intelligence-publish-button">Publish</button>
    `;

    hideArchitectureIntelligenceBuyerLabControls(root);

    const golden = root.querySelector(
      `[data-testid="${ARCHITECTURE_INTELLIGENCE_BUYER_HIDDEN_LAB_CONTROL_TEST_IDS[0]}"]`,
    );
    const fixture = root.querySelector(
      `[data-testid="${ARCHITECTURE_INTELLIGENCE_BUYER_HIDDEN_LAB_CONTROL_TEST_IDS[1]}"]`,
    );
    const publish = root.querySelector('[data-testid="architecture-intelligence-publish-button"]');

    expect(golden).toBeInstanceOf(HTMLElement);
    expect(fixture).toBeInstanceOf(HTMLElement);
    expect(publish).toBeInstanceOf(HTMLElement);
    expect((golden as HTMLElement).hidden).toBe(true);
    expect((fixture as HTMLElement).hidden).toBe(true);
    expect((golden as HTMLElement).getAttribute("aria-hidden")).toBe("true");
    expect((fixture as HTMLElement).getAttribute("aria-hidden")).toBe("true");
    expect((golden as HTMLElement).tabIndex).toBe(-1);
    expect((fixture as HTMLElement).tabIndex).toBe(-1);
    expect((publish as HTMLElement).hidden).toBe(false);
  });

  it("is a no-op when the lab controls are not in the tree", () => {
    const root = document.createElement("div");
    root.innerHTML = `<button data-testid="architecture-intelligence-publish-button">Publish</button>`;

    expect(() => hideArchitectureIntelligenceBuyerLabControls(root)).not.toThrow();
    expect(
      (root.querySelector('[data-testid="architecture-intelligence-publish-button"]') as HTMLElement)
        .hidden,
    ).toBe(false);
  });
});
