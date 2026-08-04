import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

/** TB-1363 — sample graph path must disclose Claims Intake demo, not tenant workspace. */
const EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS = [
  "Claims Intake",
  "not your workspace",
  "not a review from your tenant",
] as const;

const EVIDENCE_TRAIL_SAMPLE_VAGUE_PHRASES = ["Open sample evidence graph", "sample evidence graph"] as const;

describe("HelpTopicMarkdownView evidence-trail (TB-1363)", () => {
  const loaded = tryLoadProductDocumentation("evidence-trail");

  it("loads evidence-trail markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("operator guide copy discloses Claims Intake sample universe honesty", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-trail documentation to load.");
    }

    const normalizedMarkdown = loaded.markdown.replace(/\*\*/g, "");

    for (const marker of EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS) {
      expect(normalizedMarkdown, `expected marker: ${marker}`).toContain(marker);
    }

    for (const vague of EVIDENCE_TRAIL_SAMPLE_VAGUE_PHRASES) {
      expect(normalizedMarkdown, `vague phrase still present: ${vague}`).not.toContain(vague);
    }
  });

  it("rendered help body keeps sample-universe honesty visible", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-trail documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = document.body.textContent ?? "";

    for (const marker of EVIDENCE_TRAIL_SAMPLE_HONESTY_MARKERS) {
      expect(visible, `expected rendered marker: ${marker}`).toContain(marker);
    }
  });
});
