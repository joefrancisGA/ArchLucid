import { describe, expect, it } from "vitest";

import { GET_STARTED_PRIMARY_CONTENT_ID } from "@/app/(marketing)/get-started/get-started-content";
import {
  GET_STARTED_FIRST_VIEWPORT_ID,
  GET_STARTED_SKIP_TARGET_ID,
} from "@/lib/get-started-page-copy";

describe("get-started-page-copy", () => {
  it("keeps skip target aligned with the first-viewport band", () => {
    expect(GET_STARTED_PRIMARY_CONTENT_ID).toBe("get-started-primary-content");
    expect(GET_STARTED_FIRST_VIEWPORT_ID).toBe("get-started-first-viewport");
    expect(GET_STARTED_SKIP_TARGET_ID).toBe(GET_STARTED_FIRST_VIEWPORT_ID);
  });
});
