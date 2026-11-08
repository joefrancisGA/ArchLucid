import { describe, expect, it } from "vitest";

import {
  SECURENOW_DIAGRAM_PATH_FOCUS_NO_NODES_BODY,
  SECURENOW_DIAGRAM_PATH_FOCUS_NO_NODES_NEXT,
} from "./securenow-diagram-path-focus-copy";

describe("securenow diagram path focus copy", () => {
  it("names Path inspect and the subscription control when hops do not match nodes", () => {
    expect(SECURENOW_DIAGRAM_PATH_FOCUS_NO_NODES_BODY).toMatch(/Path inspect/i);
    expect(SECURENOW_DIAGRAM_PATH_FOCUS_NO_NODES_NEXT).toMatch(/Show the rest of the subscription/i);
  });
});
