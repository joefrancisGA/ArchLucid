> **Scope:** Statement-of-work template for **Custom Policy Pack Authoring** professional services (not legal advice).

> **Pricing source:** All SKU list prices live only in [PRICING_PHILOSOPHY.md §4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services) and [§5.2](PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision). Do not restate dollar figures in customer-facing copies — reference the order form line item.

# Custom Policy Pack Authoring — Statement of Work (template)

**Important — not legal advice.** Qualified legal counsel must review before customer signature.

**Related:** [PRICING_PHILOSOPHY.md §4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services) · [ORDER_FORM_TEMPLATE.md — Addendum C](ORDER_FORM_TEMPLATE.md#addendum-c--custom-policy-pack-authoring-professional-services)

---

## 1. Parties and engagement summary

| Field | Value |
|-------|-------|
| **Customer** | __________________ |
| **SKU** | ☐ Starter  ☐ Standard  ☐ Program |
| **IP tier** | ☐ Customer-exclusive  ☐ ArchLucid-owned (shared) |
| **Effective date** | __________________ |
| **Target delivery window** | Per SKU in [PRICING_PHILOSOPHY.md §4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services) |

---

## 2. Scope phases

| Phase | Activities | Exit criteria |
|-------|------------|---------------|
| **Discovery** | Review customer's committed manifests, evidence chain, and governance goals; agree rule categories and severity model | Signed scope appendix listing pack names and rule count |
| **Authoring** | Draft policy-pack rules (keys, severity, advisory text, remediation hints) in ArchLucid pack format | Draft pack importable to a non-production workspace |
| **Validation** | Run pack against agreed baseline manifests; tune false positives | Validation report delivered (see §5) |
| **Acceptance** | Customer sign-off on pack behavior | Acceptance certificate signed |

---

## 3. Deliverables

- Policy pack artifact(s) importable into the Customer tenant (rule keys, severity, advisory text).
- **Validation report** documenting runs executed, findings triggered, and false-positive rate vs agreed threshold.
- Operator handoff notes (how to assign packs, governance hooks, and update cadence).

---

## 4. In scope / out of scope

**In scope:** Policy pack authoring, validation against Customer-provided committed manifests, post-delivery support window per SKU.

**Out of scope:** Custom connector development, air-gapped deployment, ongoing pack operations after the post-delivery support window (unless maintenance addendum signed), training workshops, and changes to ArchLucid product code or tenant feature flags.

---

## 5. Acceptance criteria

Validation runs against the Customer's **most recent committed manifest(s)** agreed in Discovery must produce a false-positive rate **at or below** the threshold documented in the scope appendix (default: **≤ 5%** of triggered findings classified as false positives by Customer reviewers).

If the threshold is not met, Vendor delivers one additional tuning iteration within the delivery window before Customer may withhold acceptance.

---

## 6. IP rights

| Right | Customer-exclusive | ArchLucid-owned (shared) |
|-------|-------------------|--------------------------|
| Customer unlimited internal use | Yes | Yes |
| ArchLucid uses generalized patterns in other engagements | No | Yes |
| ArchLucid incorporates generalized patterns into `PlatformDefault` | No | Yes (at ArchLucid discretion) |
| ArchLucid sells the **same pack verbatim** to a direct competitor of Customer | No | No |
| Customer receives bug-fix updates from generalized improvements | No | Yes |

*Verbatim pack resale to a direct competitor is prohibited under both tiers; only generalized patterns may flow under the shared tier.*

---

## 7. Maintenance addendum (optional)

When Customer elects annual maintenance (see [PRICING_PHILOSOPHY.md §4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services)):

| Term | Detail |
|------|--------|
| **Fee** | 20% of original authoring fee per year, invoiced annually |
| **Includes** | Severity tuning, rule text updates for ArchLucid platform compatibility, one validation refresh per year |
| **Excludes** | Net-new packs beyond SKU scope, connector work, on-site training |

---

## 8. Termination and IP on termination

If Customer terminates for convenience before Acceptance, Customer receives deliverables completed to date; fees are pro-rated per the order form. On termination after Acceptance, Customer retains use rights per the selected IP tier. Customer-exclusive packs remain Customer-confidential; shared-tier generalized patterns already incorporated into `PlatformDefault` are not reverted.

---

## 9. Signature

| | Customer | Vendor |
|--|----------|--------|
| **Name** | | |
| **Title** | | |
| **Date** | | |
