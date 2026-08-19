import { describe, expect, it } from "vitest";

import {
  EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS,
  EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS,
  EVIDENCE_UPLOAD_ACCEPT_EXTENSIONS_ATTR,
} from "@/lib/evidence-upload-accepted-formats";

describe("evidence-upload-accepted-formats", () => {
  it("keeps the accept attribute aligned with the row list", () => {
    expect(EVIDENCE_UPLOAD_ACCEPT_EXTENSIONS_ATTR).toBe(EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS.join(","));
    expect(EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS.map((row) => row.extension)).toEqual([
      ...EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS,
    ]);
  });
});
