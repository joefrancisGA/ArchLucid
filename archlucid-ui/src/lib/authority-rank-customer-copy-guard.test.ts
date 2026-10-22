import { describe, expect, it } from "vitest";

import {
  INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
  INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE,
} from "@/app/(operator)/administration/developer/developer-settings-copy";
import {
  MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY,
  MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY,
} from "@/lib/model-governance-copy";

const AUTHORITY_ENUM_TOKEN = /(?:Admin|Execute|Read)Authority/i;

/** Customer-visible copy fixtures guarded against internal policy rank enum leakage (WA-06 / TB-1926). */
const CUSTOMER_FORBIDDEN_STATE_COPY_FIXTURES: readonly string[] = [
  MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY,
  MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY,
  INTERNAL_DEVELOPER_TOOLS_ACCESS_NOTE,
  INTERNAL_DEVELOPER_TOOLS_CATALOG_GATE_NOTE,
];

describe("authority rank customer copy guard (WA-06)", () => {
  it("keeps named forbidden-state fixtures free of *Authority enum tokens", () => {
    for (const copy of CUSTOMER_FORBIDDEN_STATE_COPY_FIXTURES) {
      expect(copy, copy).not.toMatch(AUTHORITY_ENUM_TOKEN);
    }
  });
});
