> **Scope:** After-hours / "11pm" incident comms template for private-beta (2–5 named tenants). Distills [`SUPPORT_POLICY.md`](../go-to-market/SUPPORT_POLICY.md#incident-communications-and-status-page) and [`FIRST_PILOT_TRIAGE_CARD.md`](FIRST_PILOT_TRIAGE_CARD.md). Founder sends; not a public status page.

# Private-beta incident comms — 15-minute template

Use when a beta tenant reports **SEV-1/2** impact outside business hours or you need a first customer-visible notice within **15 minutes** of confirming impact.

## Before you send (2 minutes)

| Item | Source |
| --- | --- |
| Severity (SEV-1–4) | [`SUPPORT_POLICY.md`](../go-to-market/SUPPORT_POLICY.md#severity-classification-sev-1-4) |
| `correlationId` + `runId` | Support bundle or API response headers |
| Blast radius | One tenant vs all tenants |
| Containment step taken | Kill switch / rollback per [`PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md`](PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md) |

## Customer email / Slack (copy-paste)

**Subject:** [ArchLucid] Service incident — {SEV-N} — {one-line impact}

1. **What we see** — {tenant(s) affected}; {feature/path}; since {UTC time}.
2. **What we are doing** — {containment or rollback in plain language}; next update in {30 min for SEV-1 / 2 hr for SEV-2}.
3. **What you can do** — Pause new reviews if stuck; send `runId` from the review URL if one run is blocked.
4. **Contact** — Reply on this thread or `security@archlucid.net` with correlation id `{correlationId}`.

Do **not** claim root cause until confirmed. Do **not** imply CPA SOC 2 or third-party pen-test publication.

## Internal log (same 15 minutes)

| Field | Value |
| --- | --- |
| Start (UTC) | |
| Reporter | |
| Tenant id | |
| SEV | |
| Customer notice sent (UTC) | |
| Next update due (UTC) | |
| Owner | founder |

## Follow-up cadence

| SEV | Customer update | Post-incident summary |
| --- | --- | --- |
| **SEV-1** | Every **30 min** while impact continues | Within **5 business days** |
| **SEV-2** | Every **2 hr** while impact continues | Within **10 business days** |

Full policy: [`INCIDENT_COMMUNICATIONS_POLICY.md`](../go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md) (alias → support policy).

## Related

- Triage order: [`FIRST_PILOT_TRIAGE_CARD.md`](FIRST_PILOT_TRIAGE_CARD.md)
- Investigation: [`INCIDENT_INVESTIGATION.md`](INCIDENT_INVESTIGATION.md)
- Invitee kit: [`PRIVATE_BETA_INVITEE_WELCOME_KIT.md`](../go-to-market/PRIVATE_BETA_INVITEE_WELCOME_KIT.md)
