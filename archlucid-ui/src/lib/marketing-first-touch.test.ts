import { describe, expect, it } from "vitest";

import {
  buildFirstTouchFromSearchParams,
  serializeFirstTouchHeader,
} from "@/lib/marketing-first-touch";

function decodeUtf8Header(encoded: string): unknown {
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

describe("first-touch registration header", () => {
  it("preserves ASCII header encoding for compatibility", () => {
    const payload = {
      utm_campaign: "spring-launch",
      capturedUtc: "2026-11-22T19:00:00.000Z",
    };

    expect(serializeFirstTouchHeader(payload)).toBe(btoa(JSON.stringify(payload)));
    expect(decodeUtf8Header(serializeFirstTouchHeader(payload))).toEqual(payload);
  });

  it("preserves UTF-8 campaign and source names without throwing", () => {
    const payload = buildFirstTouchFromSearchParams(
      new URLSearchParams({
        utm_source: "café",
        utm_campaign: "東京 – Überprüfung 🚀",
      }),
    );

    expect(payload).not.toBeNull();
    expect(() => serializeFirstTouchHeader(payload!)).not.toThrow();
    expect(decodeUtf8Header(serializeFirstTouchHeader(payload!))).toEqual(payload);
  });
});
