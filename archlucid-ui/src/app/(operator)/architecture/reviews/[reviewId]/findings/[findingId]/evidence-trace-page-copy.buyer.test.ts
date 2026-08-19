import { describe, expect, it } from "vitest";

import { EVIDENCE_TRACE_PAGE_SUBTITLE } from "@/lib/findings/finding-evidence-navigation";

import {
  EVIDENCE_TRACE_CLAIM_HEADING,
  EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER,
  evidenceTracePageSubtitle,
} from "./evidence-trace-page-copy";

describe("evidence-trace-page-copy buyer page chrome", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(evidenceTracePageSubtitle(true)).toBe(EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER);
    expect(evidenceTracePageSubtitle(false)).toBe(EVIDENCE_TRACE_PAGE_SUBTITLE);
  });

  it("keeps claim heading trace-first", () => {
    expect(EVIDENCE_TRACE_CLAIM_HEADING.toLowerCase()).toContain("trace");
  });
});
