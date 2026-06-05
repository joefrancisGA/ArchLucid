> **Scope:** Contributor-reference — engineering index for TB-274 security/platform register (BE-001…BE-061, SEC-001…SEC-035). Eight SEC/BE pairs count once for fix scope; both IDs may remain in planning notes.

# TB-274 register index

**Unique fixes (planning):** ~88 engineering items across **96** register rows (SEC-01/BE-014 … SEC-08/BE-034 overlap).

## Shipped batches (on `master`)

| Batch | Register focus | Status |
| --- | --- | --- |
| **5DE–5DI** | SEC-01–03 / BE-014–016 IDOR guards; trace redaction; trial register token; demo static fallback + `Demo:Enabled` production fail-fast | Done |
| **5DG-export-p0** | BE-022-class export blob SSRF; reference-evidence trusted API base | Done |
| **5DH-evidence-p0** | Curated evidence DDL parity; tenant-scoped proposals; atomic promote | Done |
| **5DJ-trust-p0** | BE-017/018-class trial JWT scope; value-report IDOR; `Demo:AnonymousViewer` production block | Done |
| **5DK-sec-remainder** | BE-022-class `SourceDocumentUrl` DNS guard; anonymous/marketing rate limits; search/webhook/evidence throttling | Done |
| **5DL-trust-p1** | BE-034 export SAS DNS policy consolidation; Slack + exec-digest anonymous rate limits | Done |
| **5DM-usability** | **TB-270**, **TB-271**, **TB-272** — review paths, correlation id, loading/empty states | Done |
| **5DL-trust-p2** | Artifact export/push cross-tenant IDOR SQL regression; scope binding on artifact export; CI matrix drift guard | Done |
| **5DN-demo-deferred** | **BDA-135** home hierarchy; **BDA-139** executive metric typography; **BDA-146** `topDecisionSynopses` on manifest summary | Done |
| **5DO-trust-remainder-p0** | Run-scoped POST IDOR (analysis-report, evidence bulk); `idempotency-posture` on export push / trial / marketing / client-error | Done |
| **5DO-trust-remainder-p1** | Terraform PR POST IDOR; ingest/quick-scan/request-import posture; mutating-route baseline sync (11 routes) | Done |
| **5DP-mutating-posture-p1** | `idempotency-posture` on ask/replay/export/advisory routes; mutating-route baseline refresh (~28 routes) | Done |
| **5DQ-trust-ingest-p0** | Extractor upload/connection `idempotency-posture`; cross-tenant runId + package download IDOR SQL regressions | Done |
| **5DR-trust-webhooks-p0** | Alert/digest/Teams/exec-digest/marketing-quote `idempotency-posture`; CI guard on alert controllers | Done |

## Recommended next batches

| Batch | Primary qualities | Scope |
| --- | --- | --- |
| **5DS-trust-internal-p0** | Trustworthiness | Internal replay/determinism routes + SCIM mutators `idempotency-posture`; governance mutator remainder |
| **TB-138** | Trustworthiness (B) | Real-LLM golden-cohort CI promotion (owner Azure OpenAI secrets / environment) |

## Excluded from Cursor batches

- **TB-135**, **TB-136** — V1.1 backlog (SOC 2 CPA, third-party pen test)
- **TB-140**, **G-REAL** — owner/credentialed real-mode evidence
