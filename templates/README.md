# ArchLucid templates

Starter artifacts for pilots, accelerators, and demos. See each subfolder’s `README.md` for template engine specifics.

## Vertical industry starters (Prompt 11)

| Vertical | Brief (wizard / paste) | Compliance rules | Policy pack (governance JSON) |
|----------|------------------------|------------------|------------------------------|
| Financial services | [briefs/financial-services/brief.md](briefs/financial-services/brief.md) | [policy-packs/financial-services/compliance-rules.json](policy-packs/financial-services/compliance-rules.json) | [policy-packs/financial-services/policy-pack.json](policy-packs/financial-services/policy-pack.json) |
| Healthcare | [briefs/healthcare/brief.md](briefs/healthcare/brief.md) | [policy-packs/healthcare/compliance-rules.json](policy-packs/healthcare/compliance-rules.json) | [policy-packs/healthcare/policy-pack.json](policy-packs/healthcare/policy-pack.json) |
| Retail / PCI | [briefs/retail/brief.md](briefs/retail/brief.md) | [policy-packs/retail/compliance-rules.json](policy-packs/retail/compliance-rules.json) | [policy-packs/retail/policy-pack.json](policy-packs/retail/policy-pack.json) |
| SaaS / SOC 2 | [briefs/saas/brief.md](briefs/saas/brief.md) | [policy-packs/saas/compliance-rules.json](policy-packs/saas/compliance-rules.json) | [policy-packs/saas/policy-pack.json](policy-packs/saas/policy-pack.json) |
| Public sector (EU) | [briefs/public-sector/brief.md](briefs/public-sector/brief.md) | [policy-packs/public-sector/compliance-rules.json](policy-packs/public-sector/compliance-rules.json) | [policy-packs/public-sector/policy-pack.json](policy-packs/public-sector/policy-pack.json) |

**Operator UI:** the new-run wizard exposes **industry vertical** cards (same briefs). The policy packs page offers **Import a vertical policy pack** (loads `policy-pack.json` from `archlucid-ui/public/vertical-templates/{vertical}/`, kept in sync with this table).

**Owner questions** (defaults in content; confirm in `docs/PENDING_QUESTIONS.md`): public-sector **EU GDPR** framing vs US FedRAMP; whether any vertical stays **paid-tier only** (repo ships all five for Core Pilot until decided).
