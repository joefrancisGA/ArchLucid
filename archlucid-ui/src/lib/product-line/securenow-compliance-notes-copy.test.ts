import { describe, expect, it } from "vitest";

import {
  SECURENOW_COMPLIANCE_NOTES_DUTIES,
  SECURENOW_COMPLIANCE_NOTES_LINKS,
  SECURENOW_COMPLIANCE_NOTES_PACKS,
} from "./securenow-compliance-notes-copy";

describe("SecureNow compliance notes copy", () => {
  it("keeps the six duties and five existing framework packs bounded", () => {
    expect(SECURENOW_COMPLIANCE_NOTES_DUTIES).toHaveLength(6);
    expect(SECURENOW_COMPLIANCE_NOTES_PACKS).toHaveLength(5);
    expect(SECURENOW_COMPLIANCE_NOTES_LINKS).toHaveLength(2);
  });
});
