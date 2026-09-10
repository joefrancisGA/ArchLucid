import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_SHARING_HELP_CANONICAL_PATH,
  ARCHITECTURE_SHARING_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SHARING_HELP_TOPIC_LABEL,
} from "@/lib/architecture-sharing-help-evidence-copy";
import {
  ARCHITECTURE_SHARING_HELP_GRANDFATHER_COPY,
  ARCHITECTURE_SHARING_HELP_NOT_IN_PRODUCT_COPY,
  ARCHITECTURE_SHARING_HELP_ROLE_CARDS,
} from "@/lib/architecture-sharing-help-guide-content";

describe("architecture-sharing help Working examples (AS-098)", () => {
  it("names the tenant boundary and refuses chat or second tenant", () => {
    expect(ARCHITECTURE_SHARING_HELP_CANONICAL_PATH).toBe("/help/architecture-sharing");
    expect(ARCHITECTURE_SHARING_HELP_TOPIC_LABEL).toContain("tenant");
    expect(ARCHITECTURE_SHARING_HELP_CLAIM_DISCIPLINE).toContain("not a second tenant");
    expect(ARCHITECTURE_SHARING_HELP_CLAIM_DISCIPLINE).toContain("not finding-comment chat");
    expect(ARCHITECTURE_SHARING_HELP_NOT_IN_PRODUCT_COPY).toContain("live presence");
  });

  it("documents restrict-to-shares roles and grandfather default", () => {
    expect(ARCHITECTURE_SHARING_HELP_ROLE_CARDS.map((role) => role.roleId)).toEqual(["view", "decide", "admin"]);
    expect(ARCHITECTURE_SHARING_HELP_GRANDFATHER_COPY).toContain("default remains open");
  });
});
