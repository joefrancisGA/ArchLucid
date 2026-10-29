import { afterEach, describe, expect, it } from "vitest";

import { REMEDIATION_FACTORY_ROW_ATTR } from "@/hooks/useRemediationFactoryShortcuts";

import {
  focusFindingCardEvidenceLink,
  focusFindingCardRow,
  focusRemediationFactoryEvidence,
  focusRemediationFactoryQueueRow,
  focusSecurityEvidencePathInspectEvidenceLink,
} from "./governance-findings-queue-keyboard-focus";

describe("governance-findings-queue-keyboard-focus", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses the evidence link on a finding card", () => {
    document.body.innerHTML = `
      <div data-finding-id="finding-1" tabindex="0">
        <a data-testid="derivation-evidence-link" href="/evidence">Open</a>
      </div>
    `;

    expect(focusFindingCardEvidenceLink("finding-1")).toBe(true);
    expect(document.activeElement?.getAttribute("data-testid")).toBe("derivation-evidence-link");
  });

  it("returns focus to the finding card row", () => {
    document.body.innerHTML = `
      <div data-finding-id="finding-1" tabindex="0"></div>
      <section tabindex="-1" id="inspect">inspect</section>
    `;

    document.getElementById("inspect")?.focus();

    expect(focusFindingCardRow("finding-1")).toBe(true);
    expect(document.activeElement?.getAttribute("data-finding-id")).toBe("finding-1");
  });

  it("focuses finding cards when data-finding-id retains padding", () => {
    document.body.innerHTML = `<div data-finding-id="  finding-1  " tabindex="0"></div>`;

    expect(focusFindingCardRow("finding-1")).toBe(true);
    expect(document.activeElement?.getAttribute("data-finding-id")).toBe("  finding-1  ");
  });

  it("focuses path inspect hop evidence when present", () => {
    document.body.innerHTML = `
      <section data-testid="security-evidence-path-inspect-panel">
        <a data-testid="security-evidence-path-hop-resource-evidence" href="/hub">Resource</a>
      </section>
    `;

    const panel = document.querySelector<HTMLElement>('[data-testid="security-evidence-path-inspect-panel"]');

    expect(focusSecurityEvidencePathInspectEvidenceLink(panel)).toBe(true);
    expect(document.activeElement?.getAttribute("data-testid")).toBe(
      "security-evidence-path-hop-resource-evidence",
    );
  });

  it("returns focus to a remediation factory queue row", () => {
    document.body.innerHTML = `
      <div ${REMEDIATION_FACTORY_ROW_ATTR}="path-1" tabindex="0"></div>
      <section tabindex="-1" id="inspect">inspect</section>
    `;

    document.getElementById("inspect")?.focus();

    expect(focusRemediationFactoryQueueRow("path-1")).toBe(true);
    expect(document.activeElement?.getAttribute(REMEDIATION_FACTORY_ROW_ATTR)).toBe("path-1");
  });

  it("prefers inspect-panel evidence for remediation factory selection", () => {
    document.body.innerHTML = `
      <div ${REMEDIATION_FACTORY_ROW_ATTR}="path-1" tabindex="0"></div>
      <section data-testid="security-evidence-path-inspect-panel">
        <a data-testid="security-evidence-path-hop-resource-evidence" href="/hub">Resource</a>
      </section>
    `;

    const panel = document.querySelector<HTMLElement>('[data-testid="security-evidence-path-inspect-panel"]');

    expect(focusRemediationFactoryEvidence("path-1", panel)).toBe(true);
    expect(document.activeElement?.getAttribute("data-testid")).toBe(
      "security-evidence-path-hop-resource-evidence",
    );
  });
});
