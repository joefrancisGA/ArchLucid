import { describe, expect, it } from "vitest";

import {
  ITSM_OUTBOUND_TRIAD_COMPACT_LINE,
  ITSM_OUTBOUND_TRIAD_HEADING,
  ITSM_OUTBOUND_TRIAD_JOBS,
  ITSM_OUTBOUND_TRIAD_WHY_THREE,
  buildItsmOutboundTriadClarity,
  resolveItsmOutboundTriadJob,
} from "@/lib/itsm/itsm-outbound-triad-clarity";

describe("itsm-outbound-triad-clarity (TB-2236)", () => {
  it("explains create ticket, disposition, and inbound human-review queue", () => {
    const model = buildItsmOutboundTriadClarity();

    expect(model.heading).toBe(ITSM_OUTBOUND_TRIAD_HEADING);
    expect(model.whyThree).toBe(ITSM_OUTBOUND_TRIAD_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("ticket");
    expect(model.whyThree.toLowerCase()).toContain("disposition");
    expect(model.whyThree.toLowerCase()).toContain("human-review");
    expect(model.compactLine).toBe(ITSM_OUTBOUND_TRIAD_COMPACT_LINE);

    expect(model.jobs).toEqual(ITSM_OUTBOUND_TRIAD_JOBS);
    expect(model.jobs.map((job) => job.id)).toEqual([
      "create-ticket",
      "disposition-finding",
      "inbound-human-review-queue",
    ]);
  });

  it("resolves each triad job by id", () => {
    expect(resolveItsmOutboundTriadJob("create-ticket")?.label).toBe("Create ticket");
    expect(resolveItsmOutboundTriadJob("disposition-finding")?.label).toBe("Disposition finding");
    expect(resolveItsmOutboundTriadJob("inbound-human-review-queue")?.label).toBe(
      "Inbound human-review queue",
    );
  });
});
