> **Scope:** Inventory of intentional `<<TOKEN>>` placeholders in `docs/go-to-market/` until owner fill. Not a buyer-facing page.

# GTM placeholder audit

**Last reviewed:** 2026-06-02

Buyer-visible **contact** placeholders in datasheets and evaluation paths are removed or linked (TB-230). Remaining `<<...>>` tokens are **template fields** for sales engineers to fill per deal — not shipped to prospects until substituted.

| Document | Token | Owner | Target fill |
| --- | --- | --- | --- |
| `REFERENCE_CUSTOMER_FIRST_CONTACT_TEMPLATE.md` | `<<CUSTOMER_NAME>>`, `<<TIER>>`, `<<PILOT_OUTCOME_SENTENCE>>`, `<<SENDER_NAME>>` | Founder / sales | Before first reference outreach |
| `reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md` | `<<CUSTOMER_NAME>>`, `<<TIER>>`, metrics, narrative blocks | Sales engineer | Before customer review of draft case study |
| `reference-customers/DESIGN_PARTNER_NEXT_CASE_STUDY.md` | Same pattern as example case study | Sales engineer | When next design partner closes |
| `reference-customers/README.md` | `<<TIER>>` in pipeline table | Sales / CS | At deal stage transition |

**CI:** `python scripts/ci/check_gtm_placeholder_tokens.py` (warn-only) lists every `<<TOKEN>>` line on each run so new customer-visible placeholders are caught early.

**Cross-refs:** [`PRODUCT_DATASHEET.md`](PRODUCT_DATASHEET.md) (contact links), [`SHOULD_YOU_EVALUATE.md`](SHOULD_YOU_EVALUATE.md) (Q2 contact link), [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) (G6 procurement honesty).
