import { afterEach, describe, expect, it } from "vitest";

import {
  focusAdjacentRemediationFactoryRow,
  REMEDIATION_FACTORY_ROW_ATTR,
} from "@/hooks/useRemediationFactoryShortcuts";

describe("focusAdjacentRemediationFactoryRow", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("advances from the navigation anchor when focus moved to inspect", () => {
    document.body.innerHTML = `
      <div ${REMEDIATION_FACTORY_ROW_ATTR}="row-1" tabindex="0"></div>
      <div ${REMEDIATION_FACTORY_ROW_ATTR}="row-2" tabindex="0"></div>
      <div ${REMEDIATION_FACTORY_ROW_ATTR}="row-3" tabindex="0"></div>
      <section tabindex="-1" id="inspect-panel">inspect</section>
    `;

    document.getElementById("inspect-panel")?.focus();

    const nextId = focusAdjacentRemediationFactoryRow(1, "row-1");

    expect(nextId).toBe("row-2");
    expect(document.activeElement?.getAttribute(REMEDIATION_FACTORY_ROW_ATTR)).toBe("row-2");
  });

  it("walks backward from the anchor without jumping to the last row first", () => {
    document.body.innerHTML = `
      <div ${REMEDIATION_FACTORY_ROW_ATTR}="row-1" tabindex="0"></div>
      <div ${REMEDIATION_FACTORY_ROW_ATTR}="row-2" tabindex="0"></div>
      <section tabindex="-1" id="inspect-panel">inspect</section>
    `;

    document.getElementById("inspect-panel")?.focus();

    const prevId = focusAdjacentRemediationFactoryRow(-1, "row-2");

    expect(prevId).toBe("row-1");
  });
});
