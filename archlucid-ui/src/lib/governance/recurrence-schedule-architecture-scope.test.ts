import { describe, expect, it } from "vitest";

import type { ArchitectureReviewRecurrenceSchedule } from "@/lib/api/governance-stickiness-api";
import {
  buildRecurrenceArchitectureScopeLead,
  filterRecurrenceSchedulesForReviewScope,
  normalizeRecurrenceScopeGuid,
  resolveRecurrenceArchitectureIdForReview,
} from "@/lib/governance/recurrence-schedule-architecture-scope";

const architectureOne = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const architectureTwo = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const sourceRunOne = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const sourceRunTwo = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function schedule(input: {
  scheduleId: string;
  sourceRunId: string;
  architectureId?: string | null;
}): ArchitectureReviewRecurrenceSchedule {
  return {
    scheduleId: input.scheduleId,
    sourceRunId: input.sourceRunId,
    architectureId: input.architectureId ?? null,
    name: "Weekly architecture review",
    cronExpression: "0 8 * * 1",
    isEnabled: true,
  };
}

describe("recurrence schedule architecture scope (CA-45)", () => {
  it("normalizes hyphenated and compact GUIDs", () => {
    expect(normalizeRecurrenceScopeGuid("ABCDEF12-3456-7890-ABCD-EF1234567890")).toBe(
      "abcdef12-3456-7890-abcd-ef1234567890",
    );
    expect(normalizeRecurrenceScopeGuid("abcdef1234567890abcdef1234567890")).toBe(
      "abcdef12-3456-7890-abcd-ef1234567890",
    );
  });

  it("filters schedules by architecture identity when known", () => {
    const schedules = [
      schedule({
        scheduleId: "11111111-1111-1111-1111-111111111111",
        sourceRunId: sourceRunOne,
        architectureId: architectureOne,
      }),
      schedule({
        scheduleId: "22222222-2222-2222-2222-222222222222",
        sourceRunId: sourceRunTwo,
        architectureId: architectureOne,
      }),
      schedule({
        scheduleId: "33333333-3333-3333-3333-333333333333",
        sourceRunId: sourceRunTwo,
        architectureId: architectureTwo,
      }),
    ];

    const filtered = filterRecurrenceSchedulesForReviewScope({
      schedules,
      sourceRunId: sourceRunOne,
      architectureId: architectureOne,
    });

    expect(filtered.map((row) => row.scheduleId)).toEqual([
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ]);
  });

  it("derives architecture id from a matching source review when not provided", () => {
    const schedules = [
      schedule({
        scheduleId: "11111111-1111-1111-1111-111111111111",
        sourceRunId: sourceRunOne,
        architectureId: architectureOne,
      }),
    ];

    expect(
      resolveRecurrenceArchitectureIdForReview({
        schedules,
        sourceRunId: sourceRunOne,
      }),
    ).toBe(architectureOne);
  });

  it("falls back to source review id when architecture id is unknown", () => {
    const schedules = [
      schedule({
        scheduleId: "11111111-1111-1111-1111-111111111111",
        sourceRunId: sourceRunOne,
        architectureId: null,
      }),
      schedule({
        scheduleId: "22222222-2222-2222-2222-222222222222",
        sourceRunId: sourceRunTwo,
        architectureId: null,
      }),
    ];

    const filtered = filterRecurrenceSchedulesForReviewScope({
      schedules,
      sourceRunId: sourceRunOne,
    });

    expect(filtered.map((row) => row.scheduleId)).toEqual(["11111111-1111-1111-1111-111111111111"]);
  });

  it("names the architecture in scope lead copy", () => {
    expect(buildRecurrenceArchitectureScopeLead({ architectureDisplayName: "Payments platform" })).toMatch(
      /Payments platform/,
    );
    expect(buildRecurrenceArchitectureScopeLead({ architectureDisplayName: null })).toMatch(
      /Recurring review of this architecture/i,
    );
  });
});
