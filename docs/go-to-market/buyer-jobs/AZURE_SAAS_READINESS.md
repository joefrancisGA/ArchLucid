> **Scope:** Buyer-job packaging — Azure SaaS readiness pilot outcome (V1 surfaces only).

# Buyer job — Azure SaaS readiness review

**Audience:** Cloud architects, platform engineers, and pilot sponsors evaluating Azure-hosted SaaS posture before production.

**Full operator walkthrough:** [`../../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md`](../../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md)

---

## Buyer question

**“Does our Azure SaaS posture hold up on Well-Architected and security-baseline themes before we commit to production?”**

---

## Required inputs

| Input | Notes |
|-------|--------|
| Operator access | **ReadAuthority** and **ExecuteAuthority** for the tenant |
| Architecture brief | System name, SaaS workload description, Azure as cloud provider |
| Azure evidence | **Azure extractor Tier 1 ZIP** (customer-run, read-only) **or** Product Tour demo review |
| Policy packs | Bundled **`saas-ctrl-001`–`008`** in tenant compliance catalog (default seed) |

No Jira, ServiceNow, Teams, Slack, Confluence, MCP, or outbound webhooks are required ([`INTEGRATION_CATALOG.md`](../INTEGRATION_CATALOG.md)).

---

## Shipped product steps (V1)

1. **Capture** — New architecture review with Azure target (`/reviews/new` or `POST /v1/architecture/request`).
2. **Ingest evidence** — Upload extractor ZIP on review detail (`POST /v1/azure-extractor/upload`).
3. **Assign policy packs** — WAF analogue + SaaS security baseline packs to project scope.
4. **Execute** — Run the review pipeline; inspect findings tied to `saas-ctrl-*` and cost/topology evidence.
5. **Commit** — Finalize manifest when findings and gate status are acceptable (`POST /v1/architecture/run/{runId}/commit`).
6. **Export** — Download architecture package / sponsor exports from review detail.

Spine reference: [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

---

## Expected artifacts

- Committed **golden manifest** with signed review record
- **Findings** linked to Azure inventory evidence and policy pack rules
- **Architecture package** exports (DOCX / ZIP) from review detail
- Optional **executive summary** / per-run ROI with explicit basis labels (Retail, EA-adjusted, Uploaded actual)

---

## Evidence generated

- Azure subscription/resource inventory from extractor ingest (read-only, customer-controlled)
- Policy evaluation traces for WAF and SaaS baseline themes
- Provenance from ingest → finding → manifest (inspectable on review detail)
- Audit-friendly commit record and export bundle

---

## Sponsor outcome

A **board- or architecture-review-ready package** that ties Azure posture evidence to actionable findings and a committed manifest — without claiming third-party certification. Align narrative with [`EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md).

---

## Related

| Doc | Use |
|-----|-----|
| [`library/walkthroughs/README.md`](../../library/walkthroughs/README.md) | Accelerator pack index |
| [`CORE_PILOT.md`](../../CORE_PILOT.md) | Four-step Core Pilot spine |
| [`PRODUCT_PACKAGING.md`](../../library/PRODUCT_PACKAGING.md) | Capability inventory |
| [`AZURE_EXTRACTOR.md`](../../library/AZURE_EXTRACTOR.md) | Extractor script and upload contract |
