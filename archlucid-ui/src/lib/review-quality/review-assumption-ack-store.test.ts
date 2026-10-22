import { describe, expect, it, vi } from "vitest";

import {
  readAcknowledgedAssumptionIds,
  writeAcknowledgedAssumptionIds,
} from "./review-assumption-ack-store";

describe("review-assumption-ack-store", () => {
  it("persists and reads acknowledgement ids per run", () => {
    const storage = new Map<string, string>();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    writeAcknowledgedAssumptionIds("run-1", new Set(["assumption-a", "assumption-b"]));

    expect(readAcknowledgedAssumptionIds("run-1")).toEqual(new Set(["assumption-a", "assumption-b"]));
    expect(readAcknowledgedAssumptionIds("run-2")).toEqual(new Set());
  });
});
