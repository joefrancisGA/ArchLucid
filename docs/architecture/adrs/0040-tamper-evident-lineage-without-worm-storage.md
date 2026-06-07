> **Scope:** ADR 0040 — tamper-evident proof lineage; WORM storage tier explicitly out of scope.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0040: Tamper-evident proof lineage without WORM storage

- **Status:** Accepted
- **Date:** 2026-06-06
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** [ADR 0039](0039-commit-sealed-evidence-immutability.md) *(clarifies deferred item #6 — hash lineage vs storage-tier immutability)*

## Context

Architecture review item **#6** asked for tamper-evident proof beyond SQL `DENY UPDATE/DELETE` ([ADR 0039](0039-commit-sealed-evidence-immutability.md) / TB-303). Reviewers and retention runbooks sometimes conflate two different guarantees:

1. **Application integrity** — content hashes and a verifiable chain linking manifest, audit, and export artifacts (“these bytes match what was committed”).
2. **Storage-tier immutability** — WORM, legal hold, or append-only blob policies on a compliance bucket (“even a storage admin cannot overwrite the object for N years”).

ArchLucid already has **partial** application-layer integrity: `ManifestHash` on golden manifests, `ManifestGenerated` audit payloads include the hash, provenance snapshots carry `SourceRevisionHash`, blob dedup uses content-addressed paths, and pilot/sponsor tooling emits `artifact-manifest.json` with SHA-256 checksums ([`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)).

**Alternatives considered**

| Alternative | Outcome |
|-------------|---------|
| **Platform-managed WORM / immutable blob tier for proof packets** | **Rejected / out of scope** — couples product to customer storage SKUs, legal-hold ops, and multi-cloud export destinations; duplicates what regulated buyers already enforce on their SIEM/archive buckets. |
| **SQL DENY only (status quo after TB-303)** | Insufficient for strict procurement questions about byte-identical sponsor packets vs committed state. |
| **Application hash lineage + verifiable export manifests; customer WORM optional** | **Accepted** — platform owns integrity evidence; customer owns long-term immutable storage of exported copies. |

## Decision

1. **WORM and immutable Azure Blob / S3 tiers are out of scope** for ArchLucid platform engineering in V1 and V1.1. Do not propose platform-provisioned WORM containers, legal-hold automation, or “immutable proof tier” Terraform as a product requirement in architecture assessments unless this ADR is explicitly reopened.

2. **Customer-controlled immutability remains valid.** Export runbooks may recommend that customers apply versioning, retention, or WORM policies on **their** audit/export prefix after download ([`AUDIT_RETENTION_POLICY.md`](../../library/AUDIT_RETENTION_POLICY.md) — customer ops, not platform SLA).

3. **In-scope item #6 work** is **application-layer tamper-evident lineage**:
   - Content-addressed hashes on commit-sealed artifacts (manifest, bundle members, key snapshots where feasible).
   - Audit events that anchor committed hashes (extend existing `ManifestGenerated` pattern).
   - First-class **export manifest** (checksum list + hash anchors) on sponsor/proof ZIP paths — not only PowerShell/CLI scripts.
   - A **verify** surface (API or CLI) that recomputes hashes and reports match/mismatch against committed anchors.

4. **Explicitly out of scope for #6:** cryptographic hash chains that require HSM signing, blockchain anchoring, third-party timestamp authorities, and platform-operated WORM storage.

5. **FK repoint detection** on `dbo.Runs` (child evidence rows repointed to another run) is a **separate** integrity concern; may share tooling with lineage verification but is not solved by WORM and is not deferred to storage tier work.

## Trade-offs

**Gains:** Clear buyer conversation — ArchLucid proves **integrity at commit and export**; customers prove **retention immutability** in their archive. Avoids Terraform/ops burden for per-tenant WORM SKUs, legal-hold runbooks, and cross-cloud blob policy parity. Focuses engineering on hashes already partially present in the pipeline.

**Sacrifices:** Strictest auditors who demand “immutable storage under vendor control” must accept customer-operated WORM or a future re-open of this ADR. A malicious `dbo` break-glass actor can still alter SQL rows despite DENY on `[ArchLucidApp]` — hash lineage detects tampering **after the fact** if exports were taken, but does not prevent owner-level SQL edits without external anchoring.

## Constraints

- **Security:** Runtime principal remains `[ArchLucidApp]` with sealed-table DENY (TB-303); lineage verification must not leak cross-tenant data.
- **Scalability:** Hash computation at commit/export must stay O(artifact size) with streaming SHA-256; no full-table rehash on read.
- **Reliability:** Verification must tolerate missing optional artifacts (partial exports) with explicit “not attested” states — same posture as [`PilotBuyerSafeEvidenceGateEvaluator`](../../../ArchLucid.Application/Pilots/PilotBuyerSafeEvidenceGateEvaluator.cs).
- **Cost:** No dedicated immutable storage tier or legal-hold API calls in platform COGS; hash fields and export manifest JSON are negligible vs LLM cost.

## Expected impact

- **Security posture:** Assessments should score **hash-linked lineage** and **export verification** as the #6 track, not “missing WORM.”
- **Operations:** Support documents customer WORM on export destination; platform does not operate legal hold.
- **Cost:** No new storage SKU line item; engineering effort shifts to manifest/audit/export consistency.
- **Procurement:** Honest claim: *“Committed evidence is sealed in SQL; sponsor packets include checksums verifiable against commit anchors; long-term immutable retention is applied by the customer on exported copies.”*

## Consequences

- **Positive:** Stops recurring WORM scope creep in reviews; aligns with TB-303 sealed evidence; reuses `ManifestHash`, provenance revision hash, and sponsor proof pack paths.
- **Negative:** Buyers requiring vendor-operated immutable storage need a custom enterprise addendum or ADR reopen.
- **Follow-ups:** TB backlog item for hash lineage + export verify (when prioritized); update trust/compliance copy to cite this ADR instead of implying platform WORM.

## Links

- [ADR 0039](0039-commit-sealed-evidence-immutability.md) — commit-sealed SQL evidence
- [`EVIDENCE_IMMUTABILITY.md`](../../library/EVIDENCE_IMMUTABILITY.md)
- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`AUDIT_RETENTION_POLICY.md`](../../library/AUDIT_RETENTION_POLICY.md) — customer cold-tier / WORM guidance

## Implementation status

**TB-307 (2026-06-06):** Application-layer lineage shipped — run export ZIPs include `export-manifest.json`; `GET /v1/artifacts/runs/{runId}/export/verify` recomputes manifest hash vs `ManifestGenerated` audit anchor. Platform WORM remains out of scope per Decision §1.
