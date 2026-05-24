> **Scope:** Enterprise audit retention extension contract — documentation only; enforcement remains operator-initiated unless a future release adds automated expiry.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Audit retention extension (Enterprise)

**Audience:** Security reviewers, auditors, procurement, and platform operators answering “how do we get **7-year** (or other extended) audit retention?”

**Related:** [`AUDIT_RETENTION_POLICY.md`](AUDIT_RETENTION_POLICY.md) · [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) · [`PROCUREMENT_FAQ.md`](../go-to-market/PROCUREMENT_FAQ.md) · [`TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md)

---

## Per-tier defaults (product packaging)

| Tier | Interactive SQL retention (guidance) | Bulk export |
|------|--------------------------------------|-------------|
| **Team** | **90 days** hot query path | Not included in tier gate |
| **Professional** | **1 year** hot query path | CSV via `GET /v1/audit/export` |
| **Enterprise** | **Custom** (negotiated) | CSV + scheduled export automation |

Canonical tier gates: [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) feature table (“Audit trail” row).

**Important:** ArchLucid does **not** ship a default **7-year** hot-database retention window. Extended retention is an **Enterprise-negotiated extension** combining periodic exports and cold storage — not an implied product default.

---

## Extension options (Enterprise)

| Option | Description | Typical buyer ask |
|--------|-------------|-------------------|
| **Extended hot window** | Keep rows in `dbo.AuditEvents` queryable beyond tier default via ops runbook (elevated principal) | “Can auditors query 24 months in the UI?” |
| **Scheduled CSV export** | Daily/weekly `GET /v1/audit/export` slices (90-day window per call) landed in customer-controlled Azure Blob | “We need monthly evidence drops.” |
| **Cold storage (WORM)** | Blob **Cool** / **Archive** tier with immutability policy or legal hold on `audit/` prefix | “We need 7-year immutable copies.” |
| **Compliance drift exports** | Point-in-time governance posture: `archlucid compliance export-drift --start-date … --end-date …` | “Show policy change activity for Q3.” |

---

## Operator steps

1. **Contract** — Add optional line item on Enterprise order form (see [`ORDER_FORM_TEMPLATE.md`](../go-to-market/ORDER_FORM_TEMPLATE.md)).
2. **Configure export automation** — Logic App, `CronJob`, or Azure Automation calling `GET /v1/audit/export` with tenant scope headers and auth (`X-Api-Key` or bearer). See examples in [`AUDIT_RETENTION_POLICY.md`](AUDIT_RETENTION_POLICY.md).
3. **Blob landing zone** — Customer subscription storage account (preferred) or ArchLucid-managed export container with customer RBAC — document in runbook.
4. **Verify** — Quarterly restore test: open random CSV month; confirm hash / immutability policy on cold tier.
5. **Optional SQL trim** — After cold copy verified, privileged job may archive or purge hot rows per [`AUDIT_RETENTION_POLICY.md`](AUDIT_RETENTION_POLICY.md) (not available to interactive app role).

**Configuration keys (today):** Retention extension is primarily **operational** — there is no single `ArchLucid:Audit:RetentionDays` product flag in V1 GA. Enterprise deals document the agreed window in the order form + this contract; ops implements via export cadence and optional SQL maintenance under break-glass principal.

---

## Cost and storage implications (directional)

Estimates depend on tenant activity (runs/month, governance events, integration volume). Treat numbers below as **order-of-magnitude planning aids**, not quotes.

| Volume band | Approx. audit rows / month | Hot SQL (1 year) | Cold blob (7 years, CSV gzip) |
|-------------|----------------------------|------------------|--------------------------------|
| Small Enterprise | 50k–200k | Low hundreds of MB | Single-digit GB total |
| Mid Enterprise | 200k–1M | ~1–5 GB | Tens of GB |
| Large Enterprise | 1M+ | Plan columnstore + export split | Customer-owned data lake |

**Cost drivers:** Azure SQL storage + backup size, blob tier (Cool vs Archive), export automation compute, egress if auditors pull from ArchLucid-hosted blob.

---

## Auditor FAQ

**Q: Can we get 7-year audit retention?**  
**A:** Yes as an **Enterprise extension**: periodic CSV exports to immutable blob storage for the full contracted period, while interactive SQL retention follows the negotiated hot window (often 1–2 years unless otherwise contracted).

**Q: Is the audit log tamper-evident?**  
**A:** Interactive inserts are append-only for the app principal (`DENY UPDATE/DELETE` on `dbo.AuditEvents` for `ArchLucidApp`). Long-term integrity relies on export cadence + customer-controlled WORM/immutability on blob copies.

**Q: How do we export compliance drift for a point-in-time review?**  
**A:** Operators run `archlucid compliance export-drift --start-date <utc> --end-date <utc>` (CSV or Markdown) against `GET /v1/governance/compliance-drift-trend`.

---

## Cross-links

- Trust posture summary: [`TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md)
- Procurement answers: [`PROCUREMENT_FAQ.md`](../go-to-market/PROCUREMENT_FAQ.md) (audit retention row)
- Hosted Enterprise onboarding: [`HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md`](HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md)
