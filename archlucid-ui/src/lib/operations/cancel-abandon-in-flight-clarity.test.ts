import { describe, expect, it } from "vitest";

import {
  assertCancelAbandonInFlightClarityComplete,
  buildCancelAbandonInFlightClarity,
} from "@/lib/operations/cancel-abandon-in-flight-clarity";

describe("cancel-abandon-in-flight-clarity (TB-2225)", () => {
  it("covers wait, leave, and stop with buyer-noun explanations", () => {
    assertCancelAbandonInFlightClarityComplete();

    const clarity = buildCancelAbandonInFlightClarity();

    expect(clarity.heading.length).toBeGreaterThan(0);
    expect(clarity.panelHeaderOneLiner).toMatch(/does not cancel/i);
    expect(clarity.panelHeaderOneLiner).toMatch(/Cancel/i);

    const wait = clarity.actions.find((action) => action.id === "wait");
    const leave = clarity.actions.find((action) => action.id === "leave");
    const stop = clarity.actions.find((action) => action.id === "stop");

    expect(wait).toBeDefined();
    expect(wait!.explanation).toMatch(/keep watching/i);
    expect(wait!.explanation).toMatch(/continues/i);
    expect(wait!.explanation).toMatch(/updates/i);

    expect(leave).toBeDefined();
    expect(leave!.explanation).toMatch(/navigate away|leaving/i);
    expect(leave!.explanation).toMatch(/does not cancel/i);
    expect(leave!.explanation).toMatch(/keeps running|server/i);

    expect(stop).toBeDefined();
    expect(stop!.explanation).toMatch(/cancel/i);
    expect(stop!.explanation).toMatch(/cooperative/i);
    expect(stop!.explanation).toMatch(/moment|not an instant/i);
  });
});
