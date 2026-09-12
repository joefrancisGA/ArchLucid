import { describe, expect, it } from "vitest";

import {
  INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_BODY,
  INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_TITLE,
  INTEGRATION_EVENTS_DLQ_CROSS_TENANT_OPS_SUFFIX,
  resolveIntegrationEventsDlqCareerHonesty,
} from "@/lib/internal/integration-events-dlq-career-honesty";

describe("integration-events-dlq-career-honesty (CG-094)", () => {
  it("always resolves ops-only honesty copy", () => {
    const presentation = resolveIntegrationEventsDlqCareerHonesty();

    expect(presentation.title).toBe(INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_TITLE);
    expect(presentation.body).toBe(INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_BODY);
    expect(presentation.title.toLowerCase()).toContain("not sealed career proof");
    expect(presentation.body.toLowerCase()).not.toContain("career-complete because");
  });

  it("reinforces cross-tenant callout is not sponsor evidence", () => {
    expect(INTEGRATION_EVENTS_DLQ_CROSS_TENANT_OPS_SUFFIX.toLowerCase()).toContain("not sponsor-ready");
  });
});
