> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Offline-verifiable export portability — claim map

**Audience:** Engineering, privacy/procurement, principal-architect diligence. Not a buyer brochure.

**Status:** Working contract for **TB-1488** / GTM **M-267**. Pair honesty CI **TB-1489** / **M-267**.

**Verdict (one line):** Departing tenants can take **committed-run export ZIPs** whose **file bytes** are checkable offline via `export-manifest.json` SHA-256 lists; **full ManifestHash ↔ commit-audit lineage** still needs ArchLucid’s live verify path (or an unpublished offline reimplementation of `ManifestHashService`) — and vanishes after hard purge unless already exported.

---

## 1. What ships today

| Capability | Surface | Offline without ArchLucid? |
|------------|---------|----------------------------|
| Architecture package + evidence ZIP | `GET /v1/artifacts/runs/{runId}/export` (`ArtifactPackagingService`) | ZIP bytes persist after download |
| Per-file SHA-256 + declared anchors | `export-manifest.json` (`ExportManifestBuilder`, ADR 0040 / Done **TB-307**) | **Yes** — `Get-FileHash` / `sha256sum` vs listed `files[].sha256` (UPPER hex) |
| Golden manifest JSON in ZIP | `manifest.json` (+ traces/artifacts/README) | Portable JSON; **not** the same as “hash = SHA256(file bytes)” |
| ManifestHash ↔ `ManifestGenerated` audit | `GET …/export/verify` (`RunExportLineageVerifier` + `IManifestHashService`) | **No** — needs live SQL + canonical hasher |
| Sponsor DOCX / CSV audit / API | Various export endpoints; DSAR Art. 20 | Machine-readable portability; **not** lineage-complete |
| PKI / code-signing of packages | — | **Not claimed** — “signed” = hash-anchored (`POSITIONING.md`) |
| Platform WORM of exports | ADR 0040 rejected | Customer applies WORM/retention on **their** copies |

Canonical hasher: `ManifestHashService` — SHA-256 over a **sorted canonical JSON projection** of `ManifestDocument` (excludes `CreatedUtc`). Dual-hasher residual: **TB-1156** / **TB-1157**.

---

## 2. Departing-tenant scenario

1. **Before** Admin-approved hard purge: export each committed run ZIP (and any audit CSV/DOCX needed). Optionally call `/export/verify` while the tenant still exists and archive the verify response with the ZIP.
2. **After** hard purge: SQL audit anchors and verify API for that tenant are gone ([`GDPR_ERASURE_VS_APPEND_ONLY_MAP.md`](GDPR_ERASURE_VS_APPEND_ONLY_MAP.md)). Offline value remaining = ZIP bytes + `export-manifest.json` file checksums + any verify receipts you saved earlier.
3. There is **no** shipped single “tenant offboard archive” that re-runs ManifestHash offline as a first-class CLI product today.

---

## 3. Honest portability claim (safe pin)

> Committed architecture packages export as ZIPs that include the golden manifest, artifacts, and an `export-manifest.json` listing per-file SHA-256 checksums plus the committed `ManifestHash` / rule-set anchors. **Anyone with the ZIP can verify that the files were not altered after packaging** using standard SHA-256 tools. **Confirming that `ManifestHash` still matches the commit-time audit anchor** is done via ArchLucid’s export verify API while the tenant exists (ADR 0040). Long-term immutable retention of exported copies is the customer’s responsibility — ArchLucid does not operate WORM for you.

---

## 4. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Fully offline-verifiable signed packages forever” | File integrity offline; lineage verify online (or saved receipt); hash ≠ PKI signature |
| “Recompute ManifestHash from the ZIP with only `sha256sum`” | File list uses plain SHA-256; ManifestHash needs canonical projection (`ManifestHashService`) |
| “After you leave, you can still call our verify API” | Verify needs tenant data — export **before** purge |
| “Art. 20 portability = full offline lineage” | Art. 20 = structured machine-readable export; lineage is ADR 0040 / **TB-307** |

---

## 5. Related owners (orchestrate, do not reopen Done)

| ID | Role |
|----|------|
| Done **TB-307** / ADR 0040 | Export manifest + live verify |
| **TB-886** | Surface verify in buyer materials (Hold / docs) |
| **TB-1156** / **TB-1157** / **M-198** / **M-199** | Dual hasher / re-lock |
| **TB-1009** / **M-160** | Append-only / sealed inventory |
| **TB-1470** / **M-265** | Erasure vs sealed (export-before-purge) |
| `DSAR_PROCESS.md` §5 | Art. 20 portability process |
| `EVIDENCE_IMMUTABILITY.md` | Verify status table |

---

## 6. Engineering follow-ons (optional; not required for honesty pin)

1. Documented **offline file-integrity** script (PowerShell) that walks `export-manifest.json` — no API.
2. Optional **offline ManifestHash recompute** CLI that embeds/documents the canonical projection (version-pinned) — only if owner wants full offline lineage; until then disclose live verify.
3. Offboard checklist: “export ZIPs + save verify JSON before purge.”
