# CIS security 04 — Execute Email OTP abuse drill (Evidence E1)

> **Depends on:** PSS-01 metrics/alerts/runbook; prefer **after** [`cis-security-01-bot-challenge-verifier.md`](cis-security-01-bot-challenge-verifier.md) if staging will test `RequireBotChallenge`.  
> **Assessment / gate:** Evidence **E1** in `.local/owner/public_self_service_identity_gate.md`; assessment remaining risk #5.  
> **Owner-heavy:** coding agent prepares checklist + captures results; live staging flood needs owner/staging access.

## Why

Code-side rate limits, counters, and alert YAML are not Proven at launch scale until a measured flood produces pass/fail evidence. Public self-service stays RED until E1 is Proven.

## Goal

Run (or fully prepare and record blockers for) the staging OTP challenge flood per `docs/runbooks/EMAIL_OTP_ABUSE_DRILL.md`, attach artifacts, and update the gate evidence row.

## Context (read first)

- `docs/runbooks/EMAIL_OTP_ABUSE_DRILL.md`
- `scripts/load/email-otp-challenge-stub.js`
- `infra/prometheus/archlucid-alerts.yml` — `ArchLucidEmailOtp*` rules
- `docs/library/OBSERVABILITY.md` — OTP metric names
- Gate Evidence E1 row in `.local/owner/public_self_service_identity_gate.md`
- Optional farm half: `docs/runbooks/SELF_SERVICE_TRIAL_ABUSE_DRILL.md` (registration farm) — same E1 bucket if owner wants both

## What to do

### 1. Preflight (agent can do without staging)

- Confirm runbook steps match current metric/alert names after PSS-01.
- Confirm stub script targets challenge endpoint + rate-limit-safe defaults (no production base URL hardcoded).
- Add a short **Evidence capture template** section to the runbook if missing:
  - Environment, timestamp, VU/duration, config snapshot (`RequireBotChallenge`, pepper present boolean only)
  - Screenshot or export of rate_limited counter + alert fire
  - Pass/fail checklist completed

### 2. Staging execution (owner or agent with access)

- Staging only; outbound email stubbed/disabled if possible.
- Run stub per runbook (`--vus` / `--duration` as documented).
- Record whether:
  - [ ] `rate_limited` / `rate_limit_triggered` metrics increased
  - [ ] Alert fired (or explain if Prometheus not wired in that env)
  - [ ] Client responses stayed buyer-safe / no stack traces
  - [ ] Challenge inserts remained bounded

### 3. Gate updates

- Update `.local/owner/public_self_service_identity_gate.md` E1 status:
  - **Proven** + link to artifact path under `.local/owner/` or runbook appendix, **or**
  - **Blocked** with reason (no staging, no metrics backend) — do not fake Proven.
- Update assessment “Remaining risks” E1 line accordingly.
- Do **not** flip public self-service GREEN from this step alone.

## Tests / artifacts

- No new unit tests required unless runbook/script bugs are found.
- Artifact: filled drill record (markdown under `.local/owner/` e.g. `email_otp_abuse_drill_YYYYMMDD.md`).

## Acceptance criteria

- [ ] Drill either **executed with pass/fail record** or **explicitly blocked** with owner-visible reason.
- [ ] Gate E1 row updated honestly.
- [ ] If fail: remediation notes (limit tuning / enable bot challenge) linked.

## Non-goals

- Production flood.
- Full launch load drill (E6 / `LAUNCH_LOAD_DRILL.md`).
- Declaring public self-service ready.

## Compile / verify scope

- Docs / scripts only unless a bug fix is required for the stub or metric names.
