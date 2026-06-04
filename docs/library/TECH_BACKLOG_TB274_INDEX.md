> **Scope:** Engineering index for TB-274 security/platform register (BE-001…BE-061, SEC-001…SEC-035). Eight SEC/BE pairs count once for fix scope; both IDs may remain in planning notes.

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

## Recommended next batches

| Batch | Primary qualities | Scope |
| --- | --- | --- |
| **5DM-usability** | Usability, Adoption friction | **TB-270**, **TB-271**, **TB-272** |
| **5DL-trust-p2** | Trustworthiness, Correctness | Remaining TB-274 SEC/BE (scope binding hardening, export/ingest regression matrix, webhook auth gaps) |
| **5DN-demo-p1** | Trustworthiness (B) | TB-273 BDA P1 sweep (~109) per [`TECH_BACKLOG_BDA_INDEX.md`](TECH_BACKLOG_BDA_INDEX.md) |

## Excluded from Cursor batches

- **TB-135**, **TB-136** — V1.1 backlog (SOC 2 CPA, third-party pen test)
- **TB-140**, **G-REAL** — owner/credentialed real-mode evidence
