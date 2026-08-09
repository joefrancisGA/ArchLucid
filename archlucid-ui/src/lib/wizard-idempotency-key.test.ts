import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  getOrCreateWizardRequestId,
  rotateWizardSubmissionSession,
} from "./wizard-idempotency-key";

describe("wizard-idempotency-key", () => {
  afterEach(() => {
    clearWizardSubmissionSession();
  });

  it("reuses stable idempotency and request ids within a wizard session", () => {
    const idempotencyA = getOrCreateWizardIdempotencyKey();
    const idempotencyB = getOrCreateWizardIdempotencyKey();
    const requestA = getOrCreateWizardRequestId();
    const requestB = getOrCreateWizardRequestId();

    expect(idempotencyB).toBe(idempotencyA);
    expect(requestB).toBe(requestA);
  });

  it("rotates both ids after a body-mismatch conflict", () => {
    const originalIdempotency = getOrCreateWizardIdempotencyKey();
    const originalRequestId = getOrCreateWizardRequestId();

    rotateWizardSubmissionSession();

    expect(getOrCreateWizardIdempotencyKey()).not.toBe(originalIdempotency);
    expect(getOrCreateWizardRequestId()).not.toBe(originalRequestId);
  });

  it("clears wizard session keys", () => {
    getOrCreateWizardIdempotencyKey();
    getOrCreateWizardRequestId();

    clearWizardSubmissionSession();

    const nextIdempotency = getOrCreateWizardIdempotencyKey();
    const nextRequestId = getOrCreateWizardRequestId();

    expect(window.sessionStorage.getItem("archlucid_wizard_idempotency_key_v1")).toBe(nextIdempotency);
    expect(window.sessionStorage.getItem("archlucid_wizard_request_id_v1")).toBe(nextRequestId);
  });
});
