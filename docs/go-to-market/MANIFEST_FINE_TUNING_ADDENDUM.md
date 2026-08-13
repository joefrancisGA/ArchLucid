> **Reviewed:** 2026-07-25

> **Scope:** Manifest fine-tuning addendum — optional continuous learning on accepted manifests; referenced by `DPA_TEMPLATE.md` and ADR 0056.

# Manifest Fine-Tuning Data Processing Addendum

**Audience:** Legal reviewers, procurement, and product/security teams documenting optional manifest-derived model training.

**Last reviewed:** 2026-07-25

---

## 1. Purpose

This addendum defines operational controls for **optional online fine-tuning** on **accepted architecture packages** (API: golden manifests; RAG-V2-003 / TB-594), referenced from the Data Processing Agreement when a customer enables package/manifest fine-tuning.

The feature is **optional**, **OFF by default**, and **separate** from core tenant-private processing and from the cross-tenant pattern library addendum.

---

## 2. Data included and excluded

### Included (when opt-in is enabled)

- Redacted architecture decision titles, categories, selected options, and rationales from finalized architecture packages in the enabling tenant's scope.
- Redacted topology summaries (service and datastore **types** and counts; not customer hostnames).
- Structural policy-control identifiers and severities from finalized architecture packages.
- Export audit metadata (manifest count, content hash, consent snapshot, timestamp).

### Explicitly excluded

- Raw run artifacts, export ZIP contents, and evidence bundle files.
- User names, email addresses, and identity claims.
- Tenant names, workspace names, project names, and customer labels (tokenized in export).
- Cross-tenant manifest mixing in a single training job.
- Unredacted URLs, hostnames, IP addresses, API keys, JWTs, or payment-card patterns (deny-list redaction applied before export).

---

## 3. Opt-in and withdrawal flow

- **Default:** OFF for all tenants (`FineTuning.ManifestConsent` = Disabled).
- **Enablement:** Explicit tenant administrator action in product controls plus contractual acknowledgment of this addendum where required.
- **Withdrawal:** Tenant administrator can disable at any time; new export and job submission fail closed immediately.
- **Propagation:** Withdrawal stops new training-data export within the same API request; in-flight Azure fine-tuning jobs are canceled when the platform receives a successful cancel call (best effort).

---

## 4. Subprocessor and residency

- Fine-tuning jobs run in the customer's configured **Azure OpenAI** region (same subprocessor posture as completion and embedding).
- No third-party fine-tuning APIs are used in V1.

---

## 5. Audit evidence

- Each export batch writes a row to `dbo.FineTuningTrainingExportAudits` (tenant-scoped).
- V1 runtime model registry is **`InMemoryFineTunedModelRegistry`** (process-local). Schema table `dbo.FineTunedModelRegistryEntries` is reserved for future SQL registry parity and is not written by application code yet.

---

## 6. Related documents

| Document | Role |
|----------|------|
| [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) | Master DPA — link this addendum for manifest fine-tuning |
| [`CROSS_TENANT_DATA_PROCESSING_ADDENDUM.md`](DPA_TEMPLATE.md#10-cross-tenant-patterns-opt-in) | Separate optional cross-tenant aggregates |
| [ADR 0056](../architecture/adrs/0056-manifest-online-fine-tuning-governance.md) | Engineering governance |
