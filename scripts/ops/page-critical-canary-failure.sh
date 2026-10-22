#!/usr/bin/env bash
# Page founder/on-call when the review-path canary fails (TB-959).
# Prefer PagerDuty Events API v2 (same integration key as terraform-monitoring critical AG).
# Fallback: generic JSON webhook (STAGING_ONCALL_WEBHOOK_URL / ARCHLUCID_CRITICAL_ALERT_WEBHOOK_URL).
set -euo pipefail

SUMMARY="${1:-ArchLucid review-path canary failed}"
RUN_URL="${2:-}"
DETAIL="${3:-}"

PD_ROUTING_KEY="${ARCHLUCID_PAGERDUTY_ROUTING_KEY:-}"
WEBHOOK_URL="${ARCHLUCID_CRITICAL_ALERT_WEBHOOK_URL:-${STAGING_ONCALL_WEBHOOK_URL:-}}"

if [ -n "${PD_ROUTING_KEY}" ]; then
  payload="$(jq -n \
    --arg rk "${PD_ROUTING_KEY}" \
    --arg summary "${SUMMARY}" \
    --arg source "github-actions-review-path-canary" \
    --arg run_url "${RUN_URL}" \
    --arg detail "${DETAIL}" \
    '{
      routing_key: $rk,
      event_action: "trigger",
      payload: {
        summary: $summary,
        severity: "critical",
        source: $source,
        custom_details: {
          run_url: $run_url,
          detail: $detail,
          alert_name: "ArchLucidReviewPathCanary"
        }
      }
    }')"
  curl -fsS -X POST \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    "https://events.pagerduty.com/v2/enqueue" \
    || echo "WARNING: PagerDuty Events API POST failed (non-fatal)."
  exit 0
fi

if [ -n "${WEBHOOK_URL}" ]; then
  payload="$(jq -n \
    --arg text "${SUMMARY} Run: ${RUN_URL}. ${DETAIL}" \
    '{text: $text}')"
  curl -fsS -X POST -H "Content-Type: application/json" -d "${payload}" "${WEBHOOK_URL}" \
    || echo "WARNING: critical alert webhook POST failed (non-fatal)."
  exit 0
fi

echo "No ARCHLUCID_PAGERDUTY_ROUTING_KEY or ARCHLUCID_CRITICAL_ALERT_WEBHOOK_URL / STAGING_ONCALL_WEBHOOK_URL set — printing summary instead of paging."
echo "summary=${SUMMARY}"
echo "run_url=${RUN_URL}"
echo "detail=${DETAIL}"
