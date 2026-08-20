import { describe, expect, it } from "vitest";

import {
  resolveVocabularyCompactLineAnchor,
  splitVocabularyCompactLine,
} from "@/lib/vocabulary/split-vocabulary-compact-line";

describe("splitVocabularyCompactLine", () => {
  it("returns the whole sentence as text when no anchors match", () => {
    const split = splitVocabularyCompactLine("Left is not right.", [
      { id: "peer", text: "Peer surface" },
    ]);

    expect(split.segments).toEqual([{ kind: "text", text: "Left is not right." }]);
    expect(split.linkedAnchorIds.size).toBe(0);
  });

  it("inlines matching peer words and leaves the rest as text", () => {
    const split = splitVocabularyCompactLine(
      "Digests are email cadence; Teams and Slack are chat alert channels.",
      [
        { id: "peer-digests", text: "Digests" },
        { id: "peer-slack", text: "Slack" },
      ],
    );

    expect(split.segments).toEqual([
      { kind: "link", text: "Digests", anchorId: "peer-digests" },
      { kind: "text", text: " are email cadence; Teams and " },
      { kind: "link", text: "Slack", anchorId: "peer-slack" },
      { kind: "text", text: " are chat alert channels." },
    ]);
  });

  it("keeps a longer overlapping span when two anchors share a start", () => {
    const split = splitVocabularyCompactLine("Microsoft Teams alerts", [
      { id: "short", text: "Microsoft" },
      { id: "long", text: "Microsoft Teams" },
    ]);

    expect(split.segments).toEqual([
      { kind: "link", text: "Microsoft Teams", anchorId: "long" },
      { kind: "text", text: " alerts" },
    ]);
  });
});

describe("resolveVocabularyCompactLineAnchor", () => {
  it("uses the explicit sentence word when the peer label would not match", () => {
    expect(
      resolveVocabularyCompactLineAnchor({
        label: "Microsoft Teams",
        compactLineAnchor: "Teams",
      }),
    ).toBe("Teams");
  });
});
