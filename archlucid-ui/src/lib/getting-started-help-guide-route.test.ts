import { describe, expect, it } from "vitest";

import {
  GETTING_STARTED_HELP_PATH,
  LEGACY_GETTING_STARTED_PATH,
} from "@/lib/getting-started-help-guide-route";

describe("getting-started-help-guide-route", () => {
  it("keeps operator help and retired bookmark paths stable", () => {
    expect(GETTING_STARTED_HELP_PATH).toBe("/help/getting-started");
    expect(LEGACY_GETTING_STARTED_PATH).toBe("/getting-started");
  });
});
