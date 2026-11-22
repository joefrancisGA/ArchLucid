import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS } from "@/lib/advisory-schedule-upcoming-preview";
import { previewRecurrenceScheduleRuns } from "@/lib/api/governance-stickiness-api";

import { useAdvisoryScheduleCreateForm } from "./use-advisory-schedule-create-form";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  // Intentionally fresh wrappers on every render: real adapters and tests can
  // change reference identity while the underlying URL is unchanged.
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => "/governance/advisory-scans",
  useSearchParams: () => {
    const params = new URLSearchParams(navigation.search);

    return {
      get: (key: string) => params.get(key),
      toString: () => params.toString(),
    };
  },
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  previewRecurrenceScheduleRuns: vi.fn(),
}));

describe("useAdvisoryScheduleCreateForm reset identity", () => {
  it("does not reset on equivalent navigation wrappers, but resets for a new formResetKey", () => {
    navigation.replace.mockReset();
    navigation.search = "";
    let renders = 0;
    const onCreate = vi.fn(async () => undefined);

    const view = renderHook(
      ({ resetKey }: { resetKey: number }) => {
        if (++renders > 25) {
          throw new Error("Advisory schedule form reset caused a render loop");
        }

        return useAdvisoryScheduleCreateForm({
          canEdit: true,
          sampleModeBlocked: false,
          creating: false,
          createSuccess: false,
          projectLabel: "Claims",
          onCreate,
          runProjectSlug: "default",
          formResetKey: resetKey,
        });
      },
      { initialProps: { resetKey: 0 } },
    );

    act(() => {
      view.result.current.updateForm({ name: "Operator-edit-preserved", nameTouched: true });
    });
    expect(view.result.current.form.name).toBe("Operator-edit-preserved");

    view.rerender({ resetKey: 0 });
    expect(view.result.current.form.name).toBe("Operator-edit-preserved");

    view.rerender({ resetKey: 1 });
    expect(view.result.current.form.name).not.toBe("Operator-edit-preserved");
    expect(renders).toBeLessThanOrEqual(25);
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("preserves an advanced-panel deep link on initial mount", () => {
    navigation.replace.mockReset();
    navigation.search = "advanced=1";

    const { result, unmount } = renderHook(() =>
      useAdvisoryScheduleCreateForm({
        canEdit: true,
        sampleModeBlocked: false,
        creating: false,
        createSuccess: false,
        projectLabel: "Claims",
        onCreate: vi.fn(async () => undefined),
        runProjectSlug: "default",
        formResetKey: 0,
      }),
    );

    expect(result.current.advancedOpen).toBe(true);
    expect(navigation.replace).not.toHaveBeenCalled();
    unmount();
  });
});

it("waits for the current preset preview before creating a schedule", async () => {
  navigation.search = "";
  vi.useFakeTimers();
  const preview = vi.mocked(previewRecurrenceScheduleRuns);
  preview.mockResolvedValue({
    isValid: true,
    nextRunUtc: ["2026-11-16T07:00:00Z"],
  });
  const onCreate = vi.fn(async () => undefined);
  const event = { preventDefault: vi.fn() } as unknown as FormEvent;

  try {
    const { result } = renderHook(() =>
      useAdvisoryScheduleCreateForm({
        canEdit: true,
        sampleModeBlocked: false,
        creating: false,
        createSuccess: false,
        projectLabel: "Claims",
        onCreate,
        runProjectSlug: "default",
        formResetKey: 0,
      }),
    );
    act(() => result.current.updateForm({ timeZoneId: "UTC" }));
    await act(() => vi.advanceTimersByTimeAsync(ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS));
    expect(result.current.formReady).toBe(true);

    act(() => result.current.updateForm({ minuteOfHour: 15 }));
    expect(result.current.formReady).toBe(false);
    expect(result.current.preview.runs).toEqual([]);
    await result.current.onSubmit(event);
    expect(onCreate).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(ADVISORY_SCHEDULE_PREVIEW_DEBOUNCE_MS));
    expect(result.current.formReady).toBe(true);
    await result.current.onSubmit(event);
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ cronExpression: "15 7 * * *" }));
  } finally {
    vi.useRealTimers();
  }
});
