import { describe, expect, it } from "vitest";

import {
  evaluateSamlSigningCertExpiryBanner,
  SAML_SP_SIGNING_CERT_WARNING_DAYS,
} from "@/lib/saml-signing-cert-expiry";

describe("evaluateSamlSigningCertExpiryBanner", () => {
  const anchorMs = Date.parse("2026-06-01T12:00:00.000Z");

  it("returns hidden when ISO missing", () => {
    expect(
      evaluateSamlSigningCertExpiryBanner({
        notAfterIsoUtc: null,
        nowMs: anchorMs,
        warningLeadDays: SAML_SP_SIGNING_CERT_WARNING_DAYS,
      }),
    ).toEqual({ showBanner: false });
  });

  it("returns expired when now is past NotAfter", () => {
    const expiryMs = Date.parse("2026-05-01T00:00:00.000Z");

    expect(
      evaluateSamlSigningCertExpiryBanner({
        notAfterIsoUtc: new Date(expiryMs).toISOString(),
        nowMs: anchorMs,
        warningLeadDays: SAML_SP_SIGNING_CERT_WARNING_DAYS,
      }),
    ).toEqual({ showBanner: true, variant: "expired", expiresAtUtcMs: expiryMs });
  });

  it("returns hidden when expiry is beyond the warning window", () => {
    const expiryMs = Date.parse("2026-08-01T00:00:00.000Z");

    expect(
      evaluateSamlSigningCertExpiryBanner({
        notAfterIsoUtc: new Date(expiryMs).toISOString(),
        nowMs: anchorMs,
        warningLeadDays: SAML_SP_SIGNING_CERT_WARNING_DAYS,
      }),
    ).toEqual({ showBanner: false });
  });

  it("returns expiring when within the inclusive warning window", () => {
    const expiryMs = Date.parse("2026-06-15T12:00:00.000Z");

    expect(
      evaluateSamlSigningCertExpiryBanner({
        notAfterIsoUtc: new Date(expiryMs).toISOString(),
        nowMs: anchorMs,
        warningLeadDays: SAML_SP_SIGNING_CERT_WARNING_DAYS,
      }),
    ).toEqual({ showBanner: true, variant: "expiring", expiresAtUtcMs: expiryMs });
  });
});
