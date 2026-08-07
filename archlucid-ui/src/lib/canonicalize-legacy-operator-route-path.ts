import { LEGACY_REVIEWS_LIST_PATH, LEGACY_RUNS_LIST_PATH, REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { DIGESTS_HUB_PATH, LEGACY_DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  LEGACY_ALERTS_PATH,
  LEGACY_AUDIT_PATH,
  LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH,
  LEGACY_POLICY_PACKS_PATH,
  pathMatchesRoutePrefix,
} from "@/lib/governance-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { LEGACY_SIGNED_RECORDS_LIST_PATH, SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

const LEGACY_ALERT_RULES_PATH = "/alert-rules";
const LEGACY_CLOUD_CONNECTIONS_PATH = "/settings/cloud-connections";
const LEGACY_DIGEST_SUBSCRIPTIONS_PATH = "/digest-subscriptions";
const LEGACY_MANIFESTS_PATH = "/manifests";
const LEGACY_SETTINGS_ROLES_PATH = "/settings/roles";
const ADMINISTRATION_USERS_PATH = "/administration/users";

/**
 * Maps legacy bookmark paths to canonical operator routes for readiness, help, and orientation lookups.
 * Permanent redirects were removed in IA batch 4 — external legacy URLs 404 unless covered by a rewrite below.
 */
export function canonicalizeLegacyOperatorRoutePath(pathname: string): string {
  const normalized = pathname.trim().length === 0 ? "/" : pathname;

  if (pathMatchesRoutePrefix(normalized, LEGACY_AUDIT_PATH)) {
    return normalized.replace(LEGACY_AUDIT_PATH, GOVERNANCE_AUDIT_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_POLICY_PACKS_PATH)) {
    return normalized.replace(LEGACY_POLICY_PACKS_PATH, GOVERNANCE_POLICY_PACKS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_ALERTS_PATH)) {
    return normalized.replace(LEGACY_ALERTS_PATH, GOVERNANCE_ALERTS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_ALERT_RULES_PATH)) {
    return normalized.replace(LEGACY_ALERT_RULES_PATH, GOVERNANCE_ALERT_RULES_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_RUNS_LIST_PATH)) {
    return normalized.replace(LEGACY_RUNS_LIST_PATH, REVIEWS_LIST_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_REVIEWS_LIST_PATH)) {
    return normalized.replace(LEGACY_REVIEWS_LIST_PATH, REVIEWS_LIST_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_CLOUD_CONNECTIONS_PATH)) {
    return normalized.replace(LEGACY_CLOUD_CONNECTIONS_PATH, CLOUD_CONNECTIONS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_DIGESTS_HUB_PATH)) {
    return normalized.replace(LEGACY_DIGESTS_HUB_PATH, DIGESTS_HUB_PATH);
  }

  if (normalized === LEGACY_DIGEST_SUBSCRIPTIONS_PATH) {
    return `${DIGESTS_HUB_PATH}?tab=subscriptions`;
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH)) {
    return normalized.replace(LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH, GOVERNANCE_EXCEPTIONS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_MANIFESTS_PATH)) {
    return normalized.replace(LEGACY_MANIFESTS_PATH, SIGNED_RECORDS_LIST_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_SIGNED_RECORDS_LIST_PATH)) {
    return normalized.replace(LEGACY_SIGNED_RECORDS_LIST_PATH, SIGNED_RECORDS_LIST_PATH);
  }

  if (normalized === LEGACY_SETTINGS_ROLES_PATH) {
    return ADMINISTRATION_USERS_PATH;
  }

  return normalized;
}
