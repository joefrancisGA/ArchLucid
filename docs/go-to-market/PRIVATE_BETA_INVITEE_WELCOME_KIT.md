> **Scope:** Founder/operator kit for **controlled beta** invitees (2–5 named tenants). Not public self-service.

# Private-beta invitee welcome kit

## Welcome email outline (founder sends)

**Subject:** Your ArchLucid private-beta access

1. **What this is** — Governed architecture review under your tenant (not a public trial).
2. **How to enter** — Use the invite link → sign in with your org IdP → land on operator home.
3. **First action** — Create a review via **Reviews → New** (or first-review guide if shown).
4. **Execution mode** — Sessions may be **Simulator** unless we agreed a **Real** pilot ZIP.
5. **Support** — Reply to this thread; include `runId` from review detail if something breaks.
6. **Response time** — Next business day ([`SUPPORT_POLICY.md`](SUPPORT_POLICY.md)).

## Known issues (tell invitees upfront)

| Topic | Honest line |
| --- | --- |
| Simulator vs Real | Labels on run detail and exports; Simulator is not production savings. |
| Workspace B | Sample / seed-backed; not live agents. |
| Quick Scan (public site) | Sample-only; AI off until owner decision (**M-110**). |
| SOC 2 / pen test | Self-assessment and owner-conducted materials only — not CPA SOC 2 or third-party pen-test publication. |
| Invite 401 after a long wait | CI/JWT mint expired or API `/health/ready` was unreachable (HTTP 000). Founder: re-issue invite; engineering: `scripts/ci/refresh_private_beta_ci_jwt.sh` and skip remaining warms on HTTP 000. |

## Kill switch and spend freeze

If a named tenant starts Real execute unexpectedly, freeze spend with [`PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md`](../runbooks/PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md) (`AgentExecution__Mode=Simulator` in under five minutes). Do **not** take auth down to stop LLM spend.

## Five canned replies

| Scenario | Reply skeleton |
| --- | --- |
| **Invite expired** | “Use the new invite link below. If SSO is required, sign in with the same email we invited.” |
| **Run stuck** | “Send the `runId` from the review URL. We will check pipeline timeline and worker health.” |
| **Training data** | “See trust center data-handling; your tenant evidence stays in your scope per DPA outline.” |
| **Empty export** | “Confirm the run reached commit/finalize; send manifest id from provenance card.” |
| **SSO misconfigured** | “Check identity-provider diagnostics in admin settings; we can walk IdP metadata together.” |

## First-week funnel metrics (log manually)

| Stage | Telemetry / manual log |
| --- | --- |
| Invited | Admin invite or SCIM row |
| Accepted invite | Bootstrap / accept API |
| Signed in | OIDC callback success |
| Created run | `/reviews/new` → row in `/reviews` |
| Finalized | Commit + manifest id |
| Exported | Audit CSV or sponsor package |

Record one row per invitee with `tenantId` redacted to an internal reference, the
UTC timestamp, `correlationId` when the stage came from an API request, and the
result (`success`, `blocked`, or `abandoned`). Do not put evidence contents, access
tokens, or raw email addresses in this log. A missing stage is a follow-up signal,
not evidence that the user completed the next stage.

## Operator onboarding

Pin [`FIRST_PILOT_TRIAGE_CARD.md`](../runbooks/FIRST_PILOT_TRIAGE_CARD.md) in your support channel before the first invite wave. Full drill catalog: [`FIRST_PILOT_SUPPORT_TRIAGE.md`](../runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md). After-hours incident comms: [`PRIVATE_BETA_INCIDENT_COMMS_15MIN.md`](../runbooks/PRIVATE_BETA_INCIDENT_COMMS_15MIN.md). Legal/trust gaps: [`PRIVATE_BETA_LEGAL_PACK_GAP_LIST.md`](PRIVATE_BETA_LEGAL_PACK_GAP_LIST.md).

## Related

- Access-path proofs: [`private_beta_access_prompt_07152026.md`](../assessments/private_beta_access_prompt_07152026.md)
- Triage: [`FIRST_PILOT_TRIAGE_CARD.md`](../runbooks/FIRST_PILOT_TRIAGE_CARD.md)
- Demo spine: [`FOUNDER_30_MIN_PACK_AB_DEMO_SCRIPT.md`](FOUNDER_30_MIN_PACK_AB_DEMO_SCRIPT.md)
