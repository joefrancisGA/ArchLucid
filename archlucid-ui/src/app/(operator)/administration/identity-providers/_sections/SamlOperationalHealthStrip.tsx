"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_EXPLANATION,
  IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_NEXT_STEP_HREF,
  IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_NEXT_STEP_LABEL,
  IDENTITY_PROVIDERS_STATUS_DISABLED,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
} from "@/lib/identity-providers-settings-copy";
import type { components } from "@/lib/openapi-schemas";
import {
  evaluateSamlSigningCertExpiryBanner,
  SAML_SP_SIGNING_CERT_WARNING_DAYS,
  type SamlSigningCertExpiryBannerDecision,
} from "@/lib/saml-signing-cert-expiry";

type AdminSamlOperationalHealthResponse = components["schemas"]["AdminSamlOperationalHealthResponse"];

const SAML_SIGNING_CERT_BANNER_DISMISS_SESSION_KEY = "archlucid.dismiss.samlSigningCertExpiryBanner.v1";

const SAML_SIGNING_CERT_EXPIRY_BANNER_DISMISS_LABEL = "Dismiss SAML signing certificate reminder";

const SAML_ROTATION_RUNBOOK_URL = resolveInAppDocHref("docs/runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md");

export type SamlOperationalHealthStripProps = {
  payload: AdminSamlOperationalHealthResponse | null;
  fetchNote: string | null;
  readonly showTechnicalDetails?: boolean;
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
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>SAML status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusTag
            kind="needs-attention"
            label={IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW}
            data-testid="saml-operational-health-fetch-status"
          />
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="saml-operational-health-fetch-note"
          >
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

  if (!payload.saml2Enabled) {
    return (
      <Card data-testid="saml-operational-health-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>SAML status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusTag kind="neutral" label={IDENTITY_PROVIDERS_STATUS_DISABLED} data-testid="saml-operational-health-status" />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="saml-operational-health-disabled-copy">
            {IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_EXPLANATION}{" "}
            <Link href={IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_NEXT_STEP_HREF} className={OPERATOR_LINK.inline}>
              {IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_NEXT_STEP_LABEL}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="saml-operational-health-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>SAML 2.0 SP operational signals</CardTitle>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {props.showTechnicalDetails === true
            ? "Mirrors read-only SAML operational health signals from the admin diagnostics API."
            : "Read-only SAML signing certificate and metadata health signals."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {bannerDecision.showBanner && !dismissedBanner ? (
          <div
            className={cn(
              "flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.body,
            )}
            role="alert"
            data-testid="saml-signing-cert-expiry-banner"
            aria-label="SAML signing certificate expiry reminder"
          >
            <div className="min-w-[240px] flex-1 space-y-2">
              <StatusTag
                kind={bannerDecision.variant === "expired" ? "blocked" : "needs-attention"}
                label={bannerDecision.variant === "expired" ? "Expired" : IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW}
                data-testid="saml-signing-cert-expiry-status"
              />
              <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {bannerDecision.variant === "expired"
                  ? "SAML SP signing certificate has expired."
                  : `SAML SP signing certificate expires within ${String(SAML_SP_SIGNING_CERT_WARNING_DAYS)} days.`}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                UTC expiry:{" "}
                <span className="font-mono">{signingIso.length > 0 ? formatUtcDiagnostic(signingIso) : "unknown"}</span>
              </p>
              <Link
                className={cn("inline-flex", OPERATOR_TYPOGRAPHY.badge, OPERATOR_LINK.nav)}
                href={SAML_ROTATION_RUNBOOK_URL}
                aria-label="SAML SP certificate rotation runbook in Help"
              >
                Rotation runbook
              </Link>
            </div>
            <DismissControl
              ariaLabel={SAML_SIGNING_CERT_EXPIRY_BANNER_DISMISS_LABEL}
              className="border-amber-800/40 text-amber-950 dark:text-amber-50"
              data-testid="saml-signing-cert-expiry-banner-dismiss"
              onDismiss={dismissSigningCertBanner}
            />
          </div>
        ) : null}

        <div className={cn("grid gap-3 text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          <dl className="m-0 space-y-1">
            <dt className={OPERATOR_NAV_GROUP_LABEL}>
              SP signing certificate NotAfter (UTC)
            </dt>
            <dd className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.micro)}>
              {signingIso.length > 0 ? formatUtcDiagnostic(signingIso) : "Unavailable"}
            </dd>
            {payload.spSigningCertificateDiagnosticSummary ? (
              <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {payload.spSigningCertificateDiagnosticSummary}
              </dd>
            ) : null}
          </dl>
          <dl className="m-0 space-y-1">
            <dt className={OPERATOR_NAV_GROUP_LABEL}>
              IdP metadata validUntil (UTC)
            </dt>
            <dd className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.micro)}>
              {metadataIso.length > 0 ? formatUtcDiagnostic(metadataIso) : "Not provided on metadata"}
            </dd>
            {payload.idpMetadataDiagnosticSummary ? (
              <dd className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                {payload.idpMetadataDiagnosticSummary}
              </dd>
            ) : null}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
