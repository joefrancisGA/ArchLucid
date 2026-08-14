import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-curated-tasks";

describe("COMMAND_PALETTE_CURATED_TASKS (TB-2241)", () => {
  it("lists architecture intelligence as a contextual-only quick task", () => {
    const task = COMMAND_PALETTE_CURATED_TASKS.find((entry) => entry.href === ARCHITECTURE_INTELLIGENCE_PATH);

    expect(task).toBeDefined();
    expect(task?.label).toBe("Architecture intelligence");
    expect(task?.searchValue).toMatch(/closed-loop reasoning/i);
  });
});
