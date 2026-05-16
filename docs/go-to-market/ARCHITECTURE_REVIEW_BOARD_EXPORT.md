> **Scope:** Architecture review board packet export (DOCX/PDF), consultant whitelabel, and checked-in marketing samples. Buyer-facing vocabulary follows [UI Glossary V1](UI_GLOSSARY_V1.md) (improvement #27).

# Architecture review board export

## Sample downloads (sanitized)

Synthetic deliverables for landing pages and procurement previews (fictitious **Contoso Architecture Partners** / **Northwind Corp**, placeholder logo pixel):

- [`samples/architecture-review-report-sample.docx`](samples/architecture-review-report-sample.docx)
- [`samples/architecture-review-report-sample.pdf`](samples/architecture-review-report-sample.pdf)

See [`samples/README.md`](samples/README.md) for regeneration. These files contain **no customer data**.

---

## How to trigger export

### Operator UI (today)

1. Open a **review** from **Reviews** (`/reviews`, `/reviews/{runId}`).
2. **Finalize review** when the architecture snapshot is ready (buyer-facing language for commit).
3. On the review detail page, open **Artifacts & exports** (or **Deliverables** in buyer-polished shells).
4. **Consulting DOCX:** use **Export to DOCX** when your principal includes `export:consulting-docx` — this uses the consulting analysis template, not the architecture review board packet described here.
5. **Architecture review board packet (DOCX/PDF):** generation is implemented in application code (`IArchitectureReviewExportService`). Dedicated UI controls and a versioned HTTP download mirroring consulting exports may ship in a follow-on; hosts with internal composition can invoke the service directly (see below).

Vocabulary for labels and headings aligns with [UI_GLOSSARY_V1.md](UI_GLOSSARY_V1.md): **Review**, **Finalize review**, **Architecture snapshot**, **Evidence graph** (UI) vs run/commit/manifest/knowledge graph (technical).

### API (consulting DOCX — live surface)

The architecture host exposes consulting analysis DOCX on the versioned architecture route (authority execution policy applies):

```http
POST /v1/architecture/run/{runId}/analysis-report/export/docx/consulting HTTP/1.1
Authorization: Bearer …
Content-Type: application/json

{}
```

Use the same tenancy, correlation id, and API gateway patterns as other `/v1/architecture/*` calls. Response is a `*.docx` attachment.

### Application entry (architecture review board packet)

For the **architecture-review-board** profile (nine-section packet, glossary-aligned headings):

- Inject **`IArchitectureReviewExportService`** and call **`GenerateReportAsync(runId, ExportFormat.Docx | ExportFormat.Pdf, whitelabel, logoBytes, httpCorrelationId, cancellationToken)`**.
- Preconditions enforced by the service: review exists, architecture snapshot loadable, **`IsCommitted`** (finalized review). Errors surface as **`RunNotFoundException`**, **`ConflictException`** (broken snapshot reference or not finalized).

Wire token for audits/metadata: **`architecture-review-board`** (`ArchitectureReviewBoardExportProfile.Token`).

---

## Whitelabel (consultants)

Pass a non-null **`WhitelabelConfiguration`**:

| Field | Purpose |
|-------|---------|
| **`FirmDisplayName`** | Cover title line (consulting firm). |
| **`ClientEngagementTitle`** | Cover subtitle (client engagement headline). |
| **`FooterAttribution`** | Optional; defaults to `Prepared by {FirmDisplayName} using ArchLucid`. |
| **`LogoBlobReference`** | Optional opaque reference for storage integrations (not rendered directly; callers resolve to bytes). |

When **`whitelabel`** is null, the packet uses ArchLucid default cover copy (**Architecture review board packet**) and footer **Prepared by ArchLucid**.

Tenant isolation: logos and branding inputs must be resolved **per tenant** from private storage; never reuse another tenant's logo bytes in export payloads.

---

## Report sections (what populates each)

Section order is stable (golden-regressed in tests). Buyer-visible headings:

| Section | Primary sources |
|---------|-----------------|
| **Executive summary** | Analysis report summary (`ArchitectureAnalysisReport.Summary`). |
| **System overview (architecture snapshot)** | Golden manifest services/datastores/relationships/governance/compliance tags. |
| **Evidence reviewed** | Evidence package request narrative, constraints, required capabilities. |
| **Architecture decisions** | Decision traces on the review (for example run events, rule audits). |
| **Key risks** | Governance classification from snapshot plus analysis warnings. |
| **Policy findings** | Policy constraints and required controls from snapshot governance. |
| **AI-assisted analysis** | Model-assisted warnings pending disposition. |
| **Traceability appendix** | Snapshot timestamps, manifest identifiers, optional correlation metadata. |
| **Recommended next actions** | Derived constraints and warnings as actionable lines. |

Cover metadata lines include **Review ID**, **Review (run) ID**, **Request ID**, **Architecture snapshot version**, and generation timestamp.

---

## Logo requirements

Validated by **`ArchitectureReviewBoardCoverLogoValidator`**:

| Rule | Detail |
|------|--------|
| **Formats** | **PNG** or **JPEG**, detected by **magic bytes** (not file extension or advertised MIME alone). |
| **Max size** | **2 MB** decoded (`MaxLogoBytes`). |
| **Empty** | Rejected when non-null; **`null`** skips embedding. |

Unsupported formats (for example BMP, WebP, GIF) are rejected even if mislabeled as `image/png`.

---

## Security review checklist (logo and branding)

- [ ] Logo bytes validated (magic-byte PNG/JPEG, size cap) before embed in DOCX/PDF streams.
- [ ] Logo retrieval uses **tenant-scoped** storage and authorization; no cross-tenant cache reuse for blob payloads used in exports.
- [ ] Blob or SAS URLs follow organizational policy (**private endpoints**, no public SMB or file shares for tenant artifacts).
- [ ] Whitelabel strings are treated as **display text** (rendering handled by OpenXML and QuestPDF); callers supply plain text fields only.
- [ ] Export operations are audited per host configuration (consulting exports emit audit events today; align architecture-review-board HTTP with the same pattern when exposed).
- [ ] Samples in **`docs/go-to-market/samples/`** are **synthetic** only; rotate if accidental real data is ever embedded.

---

## Regenerating samples

From repository root (PowerShell example):

```powershell
$env:ARCHLUCID_WRITE_GTM_ARB_SAMPLES = "1"
dotnet test .\ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj `
  --filter "FullyQualifiedName~ArchitectureReviewBoardMarketingSampleGeneratorTests"
```

Optional: **`ARCHLUCID_REPO_ROOT`** when the test cannot walk to a directory containing **`docs/go-to-market`**.

---

## Acceptance criteria (GA task cross-check)

- [x] Tests exercise DOCX/PDF **with whitelabel plus logo** (`ArchitectureReviewBoardExportDocxStructureTests`, `ArchitectureReviewBoardExportPdfStructureTests`, pipeline integration tests).
- [x] Sample **DOCX** and **PDF** exist under **`docs/go-to-market/samples/`** for marketing links.
- [x] Logo handling security checklist documented (this page).
- [x] Export copy uses glossary-aligned terms (**architecture snapshot**, **finalize/finalized review**, **review** context) per **#27** and [`UI_GLOSSARY_V1.md`](UI_GLOSSARY_V1.md).
