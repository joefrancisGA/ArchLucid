"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";
import type { components } from "@/lib/openapi-schemas";
import {
  evaluateSamlSigningCertExpiryBanner,
  SAML_SP_SIGNING_CERT_WARNING_DAYS,
  type SamlSigningCertExpiryBannerDecision,
} from "@/lib/saml-signing-cert-expiry";

type AdminSamlOperationalHealthResponse = components["schemas"]["AdminSamlOperationalHealthResponse"];

const SAML_SIGNING_CERT_BANNER_DISMISS_SESSION_KEY = "archlucid.dismiss.samlSigningCertExpiryBanner.v1";

const SAML_SIGNING_CERT_EXPIRY_BANNER_DISMISS_LABEL = "Dismiss SAML signing certificate reminder";

const SAML_ROTATION_RUNBOOK_URL = `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md`;

export type SamlOperationalHealthStripProps = {
  payload: AdminSamlOperationalHealthResponse | null;
  fetchNote: string | null;
};

function formatUtcDiagnostic(iso: string): string {
  const ms = Date.parse(iso);

  if (Number.isNaN(ms)) {
    return iso;
  }

  return new Date(ms).toISOString();
}

export function SamlOperationalHealthStrip(props: SamlOperationalHealthStripProps) {
  const { payload, fetchNote } = props;

  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    try {
      if (globalThis.sessionStorage?.getItem(SAML_SIGNING_CERT_BANNER_DISMISS_SESSION_KEY) === "1") {
        setDismissedBanner(true);
      }
    } catch {
      // sessionStorage may be unavailable (privacy mode).
    }
  }, []);

  if (!payload && !fetchNote) {
    return null;
  }

  if (!payload) {
    return (
      <Card data-testid="saml-operational-health-card">
        <CardHeader>
          <CardTitle className="text-base">SAML 2.0 SP operational signals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm text-amber-900 dark:text-amber-100" data-testid="saml-operational-health-fetch-note">
            {fetchNote}
          </p>
        </CardContent>
      </Card>
    );
  }

  let bannerDecision: SamlSigningCertExpiryBannerDecision = { showBanner: false };

  if (payload.saml2Enabled === true) {
    bannerDecision = evaluateSamlSigningCertExpiryBanner({
      notAfterIsoUtc: payload.spSigningCertificateNotAfterUtc,
      nowMs: Date.now(),
      warningLeadDays: SAML_SP_SIGNING_CERT_WARNING_DAYS,
    });
  }

  function dismissSigningCertBanner(): void {
    try {
      globalThis.sessionStorage?.setItem(SAML_SIGNING_CERT_BANNER_DISMISS_SESSION_KEY, "1");
    } catch {
      // Ignore storage failures — dismissal still hides for this render session via React state.
    }

    setDismissedBanner(true);
  }

  const signingIso =
    typeof payload.spSigningCertificateNotAfterUtc === "string"
      ? payload.spSigningCertificateNotAfterUtc.trim()
      : "";

  const metadataIso =
    typeof payload.idpMetadataValidUntilUtc === "string" ? payload.idpMetadataValidUntilUtc.trim() : "";

  return (
    <Card data-testid="saml-operational-health-card">
      <CardHeader>
        <CardTitle className="text-base">SAML 2.0 SP operational signals</CardTitle>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Mirrors read-only fields from{" "}
          <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
            GET /v1/admin/auth/saml-operational-health
          </span>{" "}
          (Admin session). Does not alter SAML authentication behaviour.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {bannerDecision.showBanner && !dismissedBanner ? (
          <div
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-amber-300/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
            data-testid="saml-signing-cert-expiry-banner"
            aria-label="SAML signing certificate expiry reminder"
          >
            <div className="min-w-[240px] flex-1 space-y-2">
              <p className="m-0 font-medium">
                {bannerDecision.variant === "expired"
                  ? "SAML SP signing certificate has expired."
                  : `SAML SP signing certificate expires within ${String(SAML_SP_SIGNING_CERT_WARNING_DAYS)} days.`}
              </p>
              <p className="m-0 text-xs text-amber-900/90 dark:text-amber-200/90">
                UTC expiry:{" "}
                <span className="font-mono">{signingIso.length > 0 ? formatUtcDiagnostic(signingIso) : "unknown"}</span>
              </p>
              <Link
                className="inline-flex text-xs font-medium text-amber-950 underline underline-offset-2 hover:text-amber-900 dark:text-amber-50 dark:hover:text-amber-100"
                href={SAML_ROTATION_RUNBOOK_URL}
                rel="noopener noreferrer"
                target="_blank"
                aria-label="SAML SP certificate rotation runbook opens on GitHub"
              >
                Rotation runbook
              </Link>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-800/40 bg-white/70 text-amber-950 hover:bg-white dark:border-amber-400/40 dark:bg-amber-950/60 dark:text-amber-50 dark:hover:bg-amber-950"
              data-testid="saml-signing-cert-expiry-banner-dismiss"
              aria-label={SAML_SIGNING_CERT_EXPIRY_BANNER_DISMISS_LABEL}
              onClick={dismissSigningCertBanner}
            >
              Dismiss
            </Button>
          </div>
        ) : null}

        {payload.saml2Enabled ? (
          <div className="grid gap-3 text-sm text-neutral-800 dark:text-neutral-100">
            <dl className="m-0 space-y-1">
              <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                SP signing certificate NotAfter (UTC)
              </dt>
              <dd className="m-0 mt-1 font-mono text-xs">
                {signingIso.length > 0 ? formatUtcDiagnostic(signingIso) : "Unavailable"}
              </dd>
              {payload.spSigningCertificateDiagnosticSummary ? (
                <dd className="m-0 mt-1 text-xs text-amber-900 dark:text-amber-100">
                  {payload.spSigningCertificateDiagnosticSummary}
                </dd>
              ) : null}
            </dl>
            <dl className="m-0 space-y-1">
              <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                IdP metadata validUntil (UTC)
              </dt>
              <dd className="m-0 mt-1 font-mono text-xs">
                {metadataIso.length > 0 ? formatUtcDiagnostic(metadataIso) : "Not provided on metadata"}
              </dd>
              {payload.idpMetadataDiagnosticSummary ? (
                <dd className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                  {payload.idpMetadataDiagnosticSummary}
                </dd>
              ) : null}
            </dl>
          </div>
        ) : (
          <p className="m-0 text-sm text-neutral-700 dark:text-neutral-200">
            SAML 2.0 SP integration is disabled (<span className="font-mono text-xs">ArchLucidAuth:Saml2:Enabled</span>{" "}
            is false).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
