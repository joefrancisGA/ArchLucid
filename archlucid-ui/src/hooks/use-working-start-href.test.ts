import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { getUserPreferences } from "@/lib/api/user-preferences";
import { architectureIdentityPath, startReviewFromArchitectureNestedHref } from "@/lib/architecture/architecture-routes";

import { useWorkingCreateStartHref, useWorkingStartHref } from "./use-working-start-href";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn(),
  readCachedUserPreferencesForMutators: () => ({
    deskContinuityIsExplicit: true,
    deskContinuity: { lastOpenDraftId: "draft", lastOpenArchitectureId: "previous" },
  }),
}));

it("updates both destinations when only the hydrated architecture ID changes", async () => {
  const hydrated = Promise.withResolvers<Awaited<ReturnType<typeof getUserPreferences>>>();
  vi.mocked(getUserPreferences).mockReturnValue(hydrated.promise);

  const { result } = renderHook(() => ({ desk: useWorkingStartHref(), create: useWorkingCreateStartHref() }));
  expect(result.current.desk).toBe(architectureIdentityPath("previous"));
  expect(result.current.create).toBe(startReviewFromArchitectureNestedHref("previous"));

  await act(async () => hydrated.resolve({
    deskContinuityIsExplicit: true,
    deskContinuity: { lastOpenDraftId: "draft", lastOpenArchitectureId: "current" },
  } as Awaited<ReturnType<typeof getUserPreferences>>));

  expect(result.current.desk).toBe(architectureIdentityPath("current"));
  expect(result.current.create).toBe(startReviewFromArchitectureNestedHref("current"));
});
