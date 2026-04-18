import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AfterCorePilotChecklistHint } from "./AfterCorePilotChecklistHint";

import { CORE_PILOT_STEP_COUNT, corePilotStepDoneStorageKey } from "@/lib/core-pilot-checklist-storage";

describe("AfterCorePilotChecklistHint", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("does not show before all Core Pilot checklist steps are marked done", () => {
    localStorage.setItem(corePilotStepDoneStorageKey(0), "1");
    render(<AfterCorePilotChecklistHint />);

    expect(screen.queryByRole("heading", { name: "Core Pilot checklist complete" })).toBeNull();
  });

  it("shows after every checklist step is marked done in localStorage", async () => {
    for (let i = 0; i < CORE_PILOT_STEP_COUNT; i++) {
      localStorage.setItem(corePilotStepDoneStorageKey(i), "1");
    }

    render(<AfterCorePilotChecklistHint />);

    expect(await screen.findByRole("heading", { name: "Core Pilot checklist complete" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("href", "/compare");
  });
});
