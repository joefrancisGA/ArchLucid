import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAdvisoryScheduleCreateForm } from "./use-advisory-schedule-create-form";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  // Intentionally fresh wrappers on every render: real adapters and tests can
  // change reference identity while the underlying URL is unchanged.
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => "/governance/advisory-scans",
  useSearchParams: () => ({
    get: (_key: string) => null,
    toString: () => "",
  }),
}));

describe("useAdvisoryScheduleCreateForm reset identity", () => {
  it("does not reset on equivalent navigation wrappers, but resets for a new formResetKey", () => {
    navigation.replace.mockReset();
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
    // Both the initial reset and the explicit new reset key synchronize URL state.
    expect(navigation.replace).toHaveBeenCalledTimes(2);
    view.unmount();
  });
});
