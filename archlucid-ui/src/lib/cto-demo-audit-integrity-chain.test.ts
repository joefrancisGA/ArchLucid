import { describe, expect, it } from "vitest";

import type { AuditEvent } from "@/lib/api/audit-api";
import {
  canonicalAuditEventPayload,
  formatAuditIntegrityHeadHash,
  sha256Hex,
  verifyAuditIntegrityChain,
} from "@/lib/cto-demo-audit-integrity-chain";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";

describe("cto-demo-audit-integrity-chain", () => {
  it("produces a stable head hash for the showcase audit sample", async () => {
    const events = getDemoSampleAuditTrailEvents();
    const first = await verifyAuditIntegrityChain(events);
    const second = await verifyAuditIntegrityChain(events);

    expect(first.verified).toBe(true);
    expect(first.eventCount).toBe(events.length);
    expect(first.headHash).toBe(second.headHash);
    expect(first.links).toHaveLength(events.length);
  });

  it("changes the head hash when an event payload is tampered", async () => {
    const events = getDemoSampleAuditTrailEvents();
    const baseline = await verifyAuditIntegrityChain(events);
    const tampered: AuditEvent = {
      ...events[0]!,
      dataJson: '{"tampered":true}',
    };
    const altered = await verifyAuditIntegrityChain([tampered, ...events.slice(1)]);

    expect(altered.headHash).not.toBe(baseline.headHash);
  });

  it("formats head hash for display", () => {
    const headHash = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

    expect(formatAuditIntegrityHeadHash(headHash)).toBe(`abcdef01…${headHash.slice(-8)}`);
  });

  it("canonical payload is deterministic", () => {
    const event = getDemoSampleAuditTrailEvents()[0]!;

    expect(canonicalAuditEventPayload(event)).toBe(canonicalAuditEventPayload(event));
  });

  it("sha256Hex is deterministic hex", async () => {
    const digest = await sha256Hex("archlucid");

    expect(digest).toHaveLength(64);
    expect(digest).toBe(await sha256Hex("archlucid"));
  });
});
