import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_ENVELOPE_COMPLETE_NOT_READY_COPY,
  CHEAP_EXPLORATION_ENVELOPE_TERMINAL_STATUS_HINT,
} from "@/lib/cheap-exploration-envelope-not-career-complete";

describe("cheap-exploration envelope not career complete (CE-012)", () => {
  it("states envelope complete is not Career seal", () => {
    expect(CHEAP_EXPLORATION_ENVELOPE_COMPLETE_NOT_READY_COPY).toMatch(/Career seal/i);
    expect(CHEAP_EXPLORATION_ENVELOPE_COMPLETE_NOT_READY_COPY).toMatch(/rehearsal/i);
  });

  it("reuses rehearsal incomplete terminal status from CG-032", () => {
    expect(CHEAP_EXPLORATION_ENVELOPE_TERMINAL_STATUS_HINT).toMatch(/Practice/i);
  });
});
