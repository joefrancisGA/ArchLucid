import { describe, expect, it } from "vitest";

import {
  EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS,
  EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS,
  EVIDENCE_UPLOAD_ACCEPT_EXTENSIONS_ATTR,
  QUICK_START_EVIDENCE_UPLOAD_DESCRIPTION,
} from "@/lib/evidence-upload-accepted-formats";

describe("evidence-upload-accepted-formats", () => {
  it("keeps the accept attribute aligned with the row list", () => {
    expect(EVIDENCE_UPLOAD_ACCEPT_EXTENSIONS_ATTR).toBe(EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS.join(","));
    expect(EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS.map((row) => row.extension)).toEqual([
      ...EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS,
    ]);
  });

  it("documents IaC, inventory ZIP, and Visio export guidance on quick start", () => {
    expect(QUICK_START_EVIDENCE_UPLOAD_DESCRIPTION).toContain(".tf");
    expect(QUICK_START_EVIDENCE_UPLOAD_DESCRIPTION).toContain(".bicep");
    expect(QUICK_START_EVIDENCE_UPLOAD_DESCRIPTION).toContain("inventory ZIP");
    expect(QUICK_START_EVIDENCE_UPLOAD_DESCRIPTION).toContain(".vsdx");
    expect(EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS).toContain(".tf");
    expect(EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS).toContain(".bicep");
    expect(EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS).toContain(".zip");
  });
});
