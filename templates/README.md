# ArchLucid templates

Starter artifacts for pilots, accelerators, and demos. See each subfolder’s `README.md` for template engine specifics.

## Vertical industry starters (Prompt 11)

| Vertical | Brief (wizard / paste) | Compliance rules | Policy pack (governance JSON) |
|----------|------------------------|------------------|------------------------------|
| Financial services | [briefs/financial-services/brief.md](briefs/financial-services/brief.md) | [policy-packs/financial-services/compliance-rules.json](policy-packs/financial-services/compliance-rules.json) | [policy-packs/financial-services/policy-pack.json](policy-packs/financial-services/policy-pack.json) |
| Healthcare | [briefs/healthcare/brief.md](briefs/healthcare/brief.md) | [policy-packs/healthcare/compliance-rules.json](policy-packs/healthcare/compliance-rules.json) | [policy-packs/healthcare/policy-pack.json](policy-packs/healthcare/policy-pack.json) |
| Retail / PCI | [briefs/retail/brief.md](briefs/retail/brief.md) | [policy-packs/retail/compliance-rules.json](policy-packs/retail/compliance-rules.json) | [policy-packs/retail/policy-pack.json](policy-packs/retail/policy-pack.json) |
| SaaS / SOC 2 | [briefs/saas/brief.md](briefs/saas/brief.md) | [policy-packs/saas/compliance-rules.json](policy-packs/saas/compliance-rules.json) | [policy-packs/saas/policy-pack.json](policy-packs/saas/policy-pack.json) |
| Public sector — EU (GDPR) | [briefs/public-sector/brief.md](briefs/public-sector/brief.md) | [policy-packs/public-sector/compliance-rules.json](policy-packs/public-sector/compliance-rules.json) | [policy-packs/public-sector/policy-pack.json](policy-packs/public-sector/policy-pack.json) |
| Public sector — US (FedRAMP / StateRAMP) | [briefs/public-sector-us/brief.md](briefs/public-sector-us/brief.md) | [policy-packs/public-sector-us/compliance-rules.json](policy-packs/public-sector-us/compliance-rules.json) | [policy-packs/public-sector-us/policy-pack.json](policy-packs/public-sector-us/policy-pack.json) |

**Operator UI:** the new-run wizard exposes **industry vertical** cards (same briefs). The policy packs page offers **Import a vertical policy pack** (loads `policy-pack.json` from `archlucid-ui/public/vertical-templates/{vertical}/`, kept in sync with this table).

**Owner decisions (Resolved 2026-04-21 — see `docs/PENDING_QUESTIONS.md` items 17 / 18):**

- **Public-sector framing:** ship **both** EU (GDPR) and US (FedRAMP / StateRAMP) — wizard exposes both cards with clear regional labels. **CJIS overlay deferred** — the US pack is **FedRAMP Moderate / NIST SP 800-53 Rev. 5 only** in v1 (owner Q&A follow-up 2026-04-21). Authoring the full CJIS Security Policy v5.9.5 control mappings (~30 controls) is captured as a future pack rather than a v1 overlay.
- **Tiering:** **all six vertical starters stay in Core Pilot / trial** for v1. No paid-tier gating on industry templates. Re-open if packaging strategy changes.
