import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  LOST_WRITE_ADR_0088_RELATIVE_PATH,
  LOST_WRITE_ADR_0089_RELATIVE_PATH,
  LOST_WRITE_ADR_0090_RELATIVE_PATH,
  LOST_WRITE_ADR_ACCEPTED_STATUSES,
} from "@/lib/lost-write-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

function readAdr(relativePath: string): string {
  const adrPath = join(REPO_ROOT, relativePath);

  expect(existsSync(adrPath), relativePath).toBe(true);

  return readFileSync(adrPath, "utf8");
}

function expectMandatorySections(adr: string): void {
  expect(adr).toMatch(/## Trade-offs/);
  expect(adr).toMatch(/## Constraints/);
  expect(adr).toMatch(/## Expected impact/);

  const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

  expect(statusMatch, "ADR must declare Proposed or Accepted status").not.toBeNull();
  expect(LOST_WRITE_ADR_ACCEPTED_STATUSES).toContain(statusMatch![1]);
}

describe("lost-write ADRs (LW-001 / LW-007 / LW-008)", () => {
  it("ADR 0088 exists, forbids omit-token LWW and live presence, and does not merge DraftRequests/Runs", () => {
    const adr = readAdr(LOST_WRITE_ADR_0088_RELATIVE_PATH);

    expectMandatorySections(adr);
    expect(adr).toMatch(/expectedUpdatedUtc/);
    expect(adr).toMatch(/forceOverwrite/);
    expect(adr).toMatch(/409/);
    expect(adr).toMatch(/security/i);
    expect(adr).toMatch(/Do not.*invent live presence/i);
    expect(adr).toMatch(/Do not.*merge.*DraftRequests.*Runs/i);
    expect(adr).toMatch(/G-REAL-06/);
    expect(adr).not.toMatch(/real-time collab editor/i);
  });

  it("ADR 0089 exists, scopes resume to livelihood writes, and forbids auth bootstrap replay", () => {
    const adr = readAdr(LOST_WRITE_ADR_0089_RELATIVE_PATH);

    expectMandatorySections(adr);
    expect(adr).toMatch(/localStorage/);
    expect(adr).toMatch(/idempotency/);
    expect(adr).toMatch(/Not GET/i);
    expect(adr).toMatch(/auth bootstrap/i);
    expect(adr).toMatch(/Do not.*replay GET/i);
    expect(adr).toMatch(/billing/);
  });

  it("ADR 0090 exists, forbids presence avatars and finding chat, and requires CAS still", () => {
    const adr = readAdr(LOST_WRITE_ADR_0090_RELATIVE_PATH);

    expectMandatorySections(adr);
    expect(adr).toMatch(/CAS still required/i);
    expect(adr).toMatch(/No SQL RLS/i);
    expect(adr).toMatch(/steal-with-confirm/i);
    expect(adr).toMatch(/not live occupancy/i);
    expect(adr).toMatch(/Do not.*invent live presence avatars/i);
    expect(adr).toMatch(/finding-comment chat/i);
  });
});
