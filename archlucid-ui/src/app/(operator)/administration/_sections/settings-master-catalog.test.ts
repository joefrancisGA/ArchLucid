import { describe, expect, it } from "vitest";

import {
  INTERNAL_DEVELOPER_TOOLS_CATALOG_DESCRIPTION,
  INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY,
} from "../developer/developer-settings-copy";
import { SETTINGS_MASTER_SECTIONS } from "./settings-master-catalog";

/** Static hub copy must not claim a destination is empty without a verified readiness signal. */
const STATIC_EMPTY_CLAIM_PATTERN =
  /\bNo\b.+\b(configured|assigned|connected)\b|\bnot configured\b|\bnone assigned\b/i;

describe("settings-master-catalog (TB-1198)", () => {
  it("does not hardcode unverified empty-state claims on hub destinations", () => {
    const destinations = SETTINGS_MASTER_SECTIONS.flatMap((section) => section.destinations);

    for (const destination of destinations) {
      const hint = destination.emptyStateHint;

      if (hint === undefined || hint.trim().length === 0) {
        continue;
      }

      expect(hint, `${destination.id} emptyStateHint`).not.toMatch(STATIC_EMPTY_CLAIM_PATTERN);
    }
  });

  it("omits emptyStateHint on integration and policy-pack destinations", () => {
    const destinations = SETTINGS_MASTER_SECTIONS.flatMap((section) => section.destinations);
    const idsThatMustNotLie = ["cloud-connections", "itsm-jira", "itsm-servicenow", "policy-packs-hub"];

    for (const id of idsThatMustNotLie) {
      const destination = destinations.find((entry) => entry.id === id);

      expect(destination, id).toBeDefined();
      expect(destination?.emptyStateHint, id).toBeUndefined();
    }
  });

  it("TB-1897: internal developer tools catalog matches shipped page inventory", () => {
    const destination = SETTINGS_MASTER_SECTIONS.flatMap((section) => section.destinations).find(
      (entry) => entry.id === "developer-tools",
    );

    expect(destination).toBeDefined();
    expect(destination?.description).toBe(INTERNAL_DEVELOPER_TOOLS_CATALOG_DESCRIPTION);
    expect(destination?.description?.toLowerCase()).not.toContain("diagnostics");
    expect(destination?.description?.toLowerCase()).toContain("theme");
    expect(destination?.description?.toLowerCase()).toContain("cli");

    const section = SETTINGS_MASTER_SECTIONS.find((entry) => entry.id === "developer-internal");
    expect(section?.keywords).not.toContain("diagnostics");
    expect(INTERNAL_DEVELOPER_TOOLS_SHIPPED_INVENTORY).toHaveLength(2);
  });

  it("TB-2203: publishes notification preference center destination", () => {
    const destination = SETTINGS_MASTER_SECTIONS.flatMap((section) => section.destinations).find(
      (entry) => entry.id === "notification-preference-center",
    );

    expect(destination).toBeDefined();
    expect(destination?.href).toBe("/administration/notifications");
    expect(destination?.requiredAuthority).toBe("ReadAuthority");
  });

});
