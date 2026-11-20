import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { RunsRowBaselineMenu } from "@/components/runs/RunsRowBaselineMenu";

vi.mock("next/navigation", () => ({ usePathname: () => "/runs" }));
vi.mock("@/lib/demo-ui-env", () => ({ isBuyerPolishedOperatorShellEnv: () => false }));

afterEach(() => window.history.replaceState(null, "", "/"));

it("keeps the bookmarked row menu open when its native state settles", () => {
  window.history.replaceState(null, "", "/runs?runsRowBaselineMenuRunId=run-2");
  render(
    <>
      <RunsRowBaselineMenu runId="run-1" />
      <RunsRowBaselineMenu runId="run-2" />
    </>,
  );

  const other = screen.getByTestId("runs-row-baseline-menu-run-1") as HTMLDetailsElement;
  const selected = screen.getByTestId("runs-row-baseline-menu-run-2") as HTMLDetailsElement;
  expect(selected.open).toBe(true);

  fireEvent(other, new Event("toggle"));
  fireEvent(selected, new Event("toggle"));
  expect(other.open).toBe(false);
  expect(selected.open).toBe(true);
  expect(new URLSearchParams(window.location.search).get("runsRowBaselineMenuRunId")).toBe("run-2");

  selected.open = false;
  fireEvent(selected, new Event("toggle"));
  expect(selected.open).toBe(false);
  expect(new URLSearchParams(window.location.search).has("runsRowBaselineMenuRunId")).toBe(false);
});
