> **Scope:** Production readiness drill pack - full detail, tables, and links in the sections below.

# Production readiness drill pack

**Purpose:** Repeatable rehearsal for deployment handoff, health, config lint, smoke review, export, support bundle, backup/restore evidence, and rollback **decision** — without destructive automation.

**Last reviewed:** 2026-05-30

---

## When to run

- Before a production or staging cutover
- After major infrastructure or configuration changes
- Quarterly operator readiness rehearsal (pair with [`V1_RC_DRILL.md`](../library/V1_RC_DRILL.md))

---

## Quick start

From the repository root (API need not be running for all steps):

```powershell
.\scripts\production-readiness-drill.ps1 -ApiBaseUrl http://localhost:5128
```

Optional flags:

| Flag | Effect |
|------|--------|
| `-SkipApiSteps` | Config lint + doc guards only (no live HTTP) |
| `-SkipSupportBundle` | Skip support-bundle collection when API is up |
| `-OutputDirectory <path>` | Override evidence folder (default: `_drill-evidence/production-readiness-<timestamp>`) |

---

## Evidence folder

Each run produces a timestamped folder containing:

| File | Content |
|------|---------|
| `drill-summary.json` | PASS/WARN/HOLD per step |
| `drill-summary.md` | Human-readable rollup |
| `config-lint/` | Config lint output when API/config available |
| `v1-rc-drill/` | RC drill artifacts when API reachable |

**No secrets** are written to artifacts. Cloud-dependent steps are **opt-in** and labeled in the summary.

---

## Step disposition vocabulary

| Disposition | Meaning |
|-------------|---------|
| **PASS** | Step completed successfully |
| **WARN** | Completed with caveats — review before production handoff |
| **HOLD** | Blocker — do not treat as production-ready |
| **SKIP** | Step not run (missing API, flag, or prerequisites) |
| **INCONCLUSIVE** | Insufficient data (e.g. no probe artifacts for availability rollup) |

---

## Staging vs production

- Default drill targets **local or staging** URLs unless you pass a production `baseUrl`.
- **Do not** treat staging probe or drill PASS as production SLA compliance.
- Production availability evidence: [`HOSTED_AVAILABILITY_ROLLUP.md`](HOSTED_AVAILABILITY_ROLLUP.md)

---

## Related documents

| Doc | Use |
|-----|-----|
| [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) | Release gate checklist |
| [`V1_RC_DRILL.md`](../library/V1_RC_DRILL.md) | HTTP RC drill detail |
| [`HOSTED_AVAILABILITY_ROLLUP.md`](HOSTED_AVAILABILITY_ROLLUP.md) | Probe rollup methodology |
| [`SUPPORT_POLICY.md`](../go-to-market/SUPPORT_POLICY.md) | Support / SLA buyer terms |
