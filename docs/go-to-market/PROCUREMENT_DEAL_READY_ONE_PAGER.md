> **Scope:** One-page procurement deal-ready index — honest about self-assessment vs deferred attestations.

# Procurement deal-ready one-pager

**Audience:** Procurement reviewers, security champions, and founders before sending the full evidence ZIP.

**Last reviewed:** 2026-05-29

---

## What is available now (V1)

| Artifact | What it proves | Link |
| --- | --- | --- |
| Trust Center narrative | Security, privacy, subprocessors, data handling posture | [`TRUST_CENTER.md`](TRUST_CENTER.md) |
| CAIQ / SIG responses | Standard questionnaire answers (self-attested) | Procurement pack build |
| DPA template | Contractual data-processing terms (legal review required) | [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) |
| Subprocessor list | Third-party processors | Trust Center + pack |
| SOC 2 roadmap + self-assessment | Readiness narrative — **not CPA attestation** | Trust Center · [`SOC2_ROADMAP.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) |
| Tenant isolation + security architecture | Design intent and controls map | Trust Center · security architecture docs |
| API SLO targets | **Targets**, not contractual SLA | [`API_SLOS.md`](../library/API_SLOS.md) |
| `--deal-ready` dry-run | Required V1 assurance **sources exist** and placeholders are buyer-safe | [`PROCUREMENT_DEAL_READY.md`](../runbooks/PROCUREMENT_DEAL_READY.md) |

Full pack request: [`HOW_TO_REQUEST_PROCUREMENT_PACK.md`](HOW_TO_REQUEST_PROCUREMENT_PACK.md)

---

## What `--deal-ready` proves and does not prove

**Proves:** Required deal-ready doc paths exist; blocking placeholder language is absent; deferred **(B)** items are labeled **DEFERRED_SCOPE** rather than hidden.

**Does not prove:** CPA-issued SOC 2 report, third-party penetration test publication, named reference customer, production contractual SLA, or live Marketplace checkout.

---

## `(B)` procurement realism (zero weight on headline `(A)` score)

| Buyer ask | V1 posture | Label |
| --- | --- | --- |
| SOC 2 Type I/II CPA report | Roadmap + self-assessment only | **DEFERRED / (B)** |
| Third-party pen test report | Internal testing narrative; no published third-party report | **DEFERRED / (B)** |
| Named public reference | Not in repo | **DEFERRED / (B)** |
| Live commerce / Marketplace transact | Sales-led order form | **DEFERRED / (B)** |

Objection handling: [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md)

---

## How to request the full pack

```powershell
python scripts/build_procurement_pack.py --dry-run --deal-ready
```

First-pilot proof collection writes the same classification under the proof folder (`procurement-deal-ready-check.txt`, `procurement-deal-ready-classification.md`).

---

## Accessibility procurement honesty

- Automated **axe-core** / **jsx-a11y** evidence exists for operator UI top routes.
- **VPAT** drafts mark manual gaps — do not claim full manual WCAG conformance without completed AT user testing.
- Contact: Trust Center accessibility row · root [`ACCESSIBILITY.md`](../../ACCESSIBILITY.md)

---

## Legal review required before external send

- DPA redlines, order form, and customer-specific security schedules
- Any buyer-specific naming in cover letters (never commit buyer legal names to the repo)
