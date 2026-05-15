# Cursor Prompts — GA Tasks #27–#32

> **Created:** 2026-05-15  
> **Source:** `docs/assessments/LATEST.md` improvements #27–#32  
> **Preceding task:** Improvement #26 (authority pipeline DTF migration) — sequenced prompts live in `docs/library/CURSOR_PROMPTS_GA_TASK_26_AUTHORITY_DTF.md`.  
> **Scope:** Each task below is broken into sequenced prompts (numbered P1, P2 …). Prompts are designed to be copy-pasted into Cursor sessions one at a time per task. Cross-task dependencies are noted where coordination is needed.

---

## Task #27 — Operator-Shell Glossary Sweep + Docs/Tests

### Dependencies
- None (foundational — other tasks #28, #30, #31, #32 reference this glossary)

### P27-1: Glossary Source-of-Truth Document

```
Create the file `docs/go-to-market/UI_GLOSSARY_V1.md` with the canonical buyer-facing ↔ technical term glossary. Content:

GLOSSARY TABLE (verbatim from owner Q&A 2026-05-15):
| Buyer-facing UI | Technical / unchanged |
|----------------|----------------------|
| **Review** | Run, run ID, `ArchitectureRun`, API `/v1/architecture/run/...` |
| **Finalize review** / **Finalize** (when context clear) | Commit, `POST .../commit`, golden manifest persistence |
| **Architecture snapshot** / **Snapshot** | Manifest, golden manifest, `GoldenManifest` |
| **Evidence graph** | Knowledge graph internally; URL path `/graph` |

WORKFLOW COPY (target wizard + run detail + exports):
- **Capture system → Add evidence → Review → Resolve findings → Record decisions → Generate report**
- Use "Architecture review" in headings/tooltips where "Review" alone is ambiguous.

CONSTRAINTS (DO NOT CHANGE WITHOUT ADR):
- HTTP paths (`/v1/...`), OpenAPI titles, `openapi-v1.contract.snapshot.json`, CLI command names, durable audit `AuditEventTypes` names, or correlation-id docs.
- React route paths remain unchanged unless redirect is required (prefer label-only changes).

Include a preamble stating this file is the single-source glossary linked from `docs/library/operator-shell.md`. Cross-reference improvement #27 from `docs/assessments/LATEST.md`.
```

### P27-2: Update `docs/library/operator-shell.md`

```
Update `docs/library/operator-shell.md` to align with the UI_GLOSSARY_V1.md just created. Specifically:

1. In the "What it is" section table, replace "Create runs, track execution, commit manifests" with language aligned to the glossary: "Create reviews, track execution, finalize reviews, review and download artifacts".

2. Add a new section "## Buyer-Facing Vocabulary" near the top (after "What it is") that links to `docs/go-to-market/UI_GLOSSARY_V1.md` as the canonical glossary and briefly summarizes the four key mappings (Review ↔ Run, Finalize ↔ Commit, Snapshot ↔ Manifest, Evidence graph ↔ Knowledge graph).

3. Audit all occurrences of "run" (as a noun referring to ArchitectureRun), "commit" (as UI action), "manifest" (user-facing), and "knowledge graph" (user-facing) in the file. Replace buyer-visible references with glossary terms. Leave technical/API references unchanged.

4. Cross-link `CORE_PILOT.md` and `PILOT_GUIDE.md` if they duplicate operator-shell UI strings — add a note that those docs should be updated in a follow-up.

CONSTRAINTS: Do not change HTTP paths, OpenAPI titles, CLI names, or AuditEventTypes. Keep technical references in prose where they explain internals.
```

### P27-3: Navigation Config Label Updates (UI)

```
Update the navigation labels in `archlucid-ui/` to match the canonical glossary from `docs/go-to-market/UI_GLOSSARY_V1.md`.

FILES TO UPDATE (inspect each for buyer-visible strings):
- `archlucid-ui/src/lib/nav-config.ts` — section/group labels
- `archlucid-ui/src/lib/nav-authority.ts` — authority-gated labels
- `archlucid-ui/src/lib/pilot-nav-group-builder.ts` — Core Pilot nav labels
- `archlucid-ui/src/lib/nav-disclosure-for-path.test.ts` — update assertions
- `archlucid-ui/src/lib/nav-shell-visibility.ts` — tooltip/description strings

GLOSSARY MAPPING (apply to user-visible strings only):
- "Run" (noun, referring to ArchitectureRun as UI concept) → "Review"
- "Commit" (as button/action label) → "Finalize review" or "Finalize"
- "Manifest" (user-visible) → "Architecture snapshot" or "Snapshot"
- "Knowledge graph" (user-visible) → "Evidence graph"

DO NOT CHANGE:
- TypeScript identifiers, variable/type names (ArchitectureRun, GoldenManifest, etc.)
- Route paths (`/run/`, `/graph/`, etc.)
- API call paths or contract references
- Test file names (only test assertions about rendered strings)

Add a tooltip to the "Finalize" action wherever it appears: "Replay and comparison remain available after finalizing."
```

### P27-4: Core Pilot Checklist + Layer Headers + Empty States

```
Continue the glossary sweep in `archlucid-ui/` for components beyond navigation:

FILES TO INSPECT AND UPDATE:
- `archlucid-ui/src/components/LayerHeader.test.tsx` + corresponding component
- `archlucid-ui/src/components/AfterCorePilotChecklistHint.tsx`
- `archlucid-ui/src/components/OperateCapabilityHints.tsx`
- `archlucid-ui/src/components/PostCommitAdvancedAnalysisHint.tsx`
- Any empty-state copy, wizard step titles, or tooltip text referencing Run/Commit/Manifest/Knowledge graph

Apply the same glossary mapping as P27-3. For each file:
1. Search for buyer-visible string literals containing "run" (noun), "commit" (action), "manifest", "knowledge graph"
2. Replace with glossary equivalent
3. Verify `aria-labelledby` and accessibility attributes remain meaningful after label changes

Run `npm test` in `archlucid-ui/` to identify failing snapshot or assertion tests — list them but do not fix yet (next prompt handles test updates).
```

### P27-5: Test Suite Updates

```
Fix all failing tests in `archlucid-ui/` caused by the glossary label changes in P27-3 and P27-4. Target files:

- `archlucid-ui/src/lib/nav-config.structure.test.ts`
- `archlucid-ui/src/lib/nav-shell-visibility.test.ts`
- `archlucid-ui/src/lib/nav-tier.ts` (if test assertions)
- `archlucid-ui/src/lib/nav-authority.test.ts`
- `archlucid-ui/src/lib/nav-disclosure-for-path.test.ts`
- `archlucid-ui/src/components/LayerHeader.test.tsx`
- `archlucid-ui/src/components/SidebarNav.test.tsx`
- Any other test files that assert on the old strings

For each test:
1. Update string assertions to match new glossary labels
2. If a snapshot file (.snap) exists, delete it so it regenerates with new strings
3. Do NOT change test logic — only update expected strings

After fixing, run `npm test` in `archlucid-ui/` and confirm all pass. Also run the UI linter. Report any remaining failures.
```

### P27-6: Verification + CI Parity

```
Verify the glossary sweep is complete and CI-ready:

1. Run `npm test` in `archlucid-ui/` — all tests must pass.
2. Run the UI linter (`npm run lint` or equivalent in `archlucid-ui/`).
3. Check that `release-smoke.ps1` / `release-smoke.cmd` still passes if it exercises UI routes.
4. Grep across `archlucid-ui/src/` for remaining buyer-visible instances of:
   - "Run" used as a noun label (exclude: variable names, route paths, API calls, "run" as a verb like "run analysis")
   - "Commit" used as a UI action label (exclude: git commit, internal method names)
   - "Manifest" used in user-facing text (exclude: type names, imports)
   - "Knowledge graph" in user-facing copy

Report any residual occurrences that should be addressed. Confirm the acceptance criteria:
- Glossary table in `docs/go-to-market/UI_GLOSSARY_V1.md` is canonical single-source
- Reader can map landing-page workflow → operator labels without interpretation
- Finalize control has tooltip about replay/compare availability
- No accessibility regression
```

---

## Task #28 — Buyer-Grade DOCX/PDF Export + Consultant Whitelabel

### Dependencies
- #27 (glossary — export section headings must use new terms)
- #29 (policy packs — "Policy findings" section needs seeded data to test)

### P28-1: Explore Existing Export Infrastructure

```
Before implementing, explore the existing export pipeline to understand the current architecture. Read and summarize the relevant code:

1. Read `ArchLucid.Application/Analysis/ExportReplayService.cs` — understand the current export flow, what formats it produces, how it accesses review/manifest data.
2. Read `ArchLucid.Api/Controllers/Authority/AnalysisReportsController.cs` — understand the HTTP endpoint for exports.
3. Read `ArchLucid.Api/Controllers/Authority/RunComparisonController.cs` — understand comparison export paths.
4. Read `ArchLucid.Api/Services/ReplayArtifactResponseFactory.cs` — understand artifact response formatting.
5. Check `docs/library/ARCHITECTURE_COMPONENTS.md` for export pipeline documentation.
6. Search for any existing DOCX generation libraries in `*.csproj` files (e.g., DocumentFormat.OpenXml, iTextSharp, QuestPDF).
7. Check if `docs/library/CONSULTING_DOCX_TEMPLATE.md` exists — read it for template guidance.

Report:
- Current export formats supported
- NuGet packages already in use for document generation
- The service interfaces involved
- Where tenant/branding data is stored
- How the UI currently triggers export
```

### P28-2: Domain Model — Export Profile + Whitelabel DTO

```
Implement the domain model for the new export profile and whitelabel configuration.

WHAT: Add domain types for the "architecture-review-board" export profile and consultant whitelabel fields.

1. In `ArchLucid.Contracts` (or wherever export DTOs live — match existing patterns):
   - Add `ExportProfileName` enum or string constant for "architecture-review-board"
   - Add `WhitelabelConfiguration` record/class:
     - `FirmDisplayName` (string, required when whitelabel enabled)
     - `ClientEngagementTitle` (string, required when whitelabel enabled)
     - `LogoBlobReference` (string?, optional — references tenant-scoped blob)
     - `FooterAttribution` (string, defaults to "Prepared by {FirmDisplayName} using ArchLucid")

2. In `ArchLucid.Application` (or appropriate layer):
   - Add `IArchitectureReviewExportService` interface with method signature:
     `Task<ExportResult> GenerateReportAsync(Guid reviewId, ExportFormat format, WhitelabelConfiguration? whitelabel, CancellationToken ct)`
   - Add `ExportFormat` enum: `Docx`, `Pdf`
   - Add `ExportResult` record: `Stream Content`, `string ContentType`, `string FileName`

3. In `ArchLucid.Persistence` (if tenant whitelabel persistence needed):
   - Add migration or DDL for tenant consultant profile table (firm name, default logo blob path) — OR reuse existing tenant branding if it exists. Check `ArchLucid_Unified_Schema.sql` for existing patterns.

CONSTRAINTS:
- Do not change existing HTTP contracts for unrelated endpoints
- Match existing coding patterns (null checks, modular one-method-per-class where appropriate)
- Whitelabel logo references must be tenant-scoped (RLS or scoped container paths — no cross-tenant leakage)
```

### P28-3: DOCX Generation Service

```
Implement the DOCX generation for the architecture-review-board export profile.

WHAT: Build `ArchitectureReviewDocxBuilder` (or appropriate name matching existing patterns) that generates a DOCX from a finalized review.

If DocumentFormat.OpenXml is not already referenced, add it to the appropriate `.csproj`. If another library is already in use (QuestPDF, etc.), prefer consistency.

REQUIRED SECTIONS in generated DOCX (use glossary terms from `docs/go-to-market/UI_GLOSSARY_V1.md`):
1. Cover page — with whitelabel fields (firm name, client/engagement title, logo if present)
2. Executive summary — pull from review metadata / AI summary if available
3. System overview — from manifest/snapshot data
4. Evidence reviewed — list evidence items attached to the review
5. Architecture decisions — from decision records in the review
6. Key risks — from findings with severity >= threshold
7. Policy findings — from policy evaluation results (improvement #29 packs)
8. AI-assisted analysis — framed as "findings requiring human disposition" (NOT autonomous authority)
9. Traceability appendix — correlation IDs, snapshot version refs, extractor timestamps
10. Recommended next actions — from unresolved findings or advisor recommendations

WHITELABEL:
- Cover page renders firm name, engagement title, optional logo
- Footer on every page: "Prepared by {firm} using ArchLucid" (configurable)
- When no whitelabel provided, use ArchLucid default branding

CONSTRAINTS:
- Professional typography (consistent headings, table styles)
- Each section must gracefully handle empty data (show "No {items} recorded" rather than crash)
- Null check all inputs
- Keep the builder modular: one method per section for testability
```

### P28-4: PDF Generation Service

```
Implement PDF generation that mirrors the DOCX output.

WHAT: Build `ArchitectureReviewPdfBuilder` (or name matching existing patterns) producing PDF with identical section structure and branding as the DOCX builder from P28-3.

APPROACH OPTIONS (pick one based on what's already in the repo):
- Option A: If a DOCX-to-PDF conversion library exists (e.g., Aspose, LibreOffice headless), convert the generated DOCX
- Option B: If QuestPDF or iText is already used, build PDF natively with matching sections
- Option C: If neither exists, add QuestPDF (MIT license, .NET native) — justify choice in a code comment

REQUIREMENTS:
- Section order must match DOCX exactly
- Cover page branding must match DOCX (firm name, logo, engagement title)
- Footer attribution must match DOCX
- Professional visual parity (margins, font choices, heading hierarchy)

CONSTRAINTS:
- Do not introduce a paid/commercial library without flagging it
- Logo rendering: enforce MIME type validation (PNG, JPEG only), max 2MB size cap
- Null-safe: handle missing sections identically to DOCX builder
```

### P28-5: API Endpoint + UI Integration

```
Wire the new export profile into the HTTP API and operator UI.

API (in `ArchLucid.Api`):
1. Add or extend the export endpoint to accept the "architecture-review-board" profile:
   - Route: match existing export patterns (likely under the run/comparison controller or a dedicated reports controller)
   - Accept: export format (docx/pdf), optional whitelabel DTO
   - Validate: review must be finalized (committed); return 400/409 if not
   - Return: file download with appropriate Content-Type and Content-Disposition headers

2. Add endpoint for tenant consultant profile CRUD (firm name, default logo):
   - POST/PUT tenant branding fields
   - GET current tenant consultant profile (for pre-filling export dialog)
   - Logo upload: validate MIME (image/png, image/jpeg), max 2MB, virus-scan pipeline (reuse existing blob upload patterns from `docs/library/SECURITY.md` guidance)

UI (in `archlucid-ui/`):
1. Add export dialog/modal on finalized review detail page:
   - Format selector: DOCX / PDF
   - Whitelabel section: firm name, engagement title, logo upload (defaults from tenant profile)
   - Preview of footer attribution string
   - "Generate Report" button → triggers download

2. Wire the export action as the default action for finalized reviews (match existing UI patterns for primary actions on review detail).

CONSTRAINTS:
- Do not break existing export endpoints for other profiles
- Logo upload must be tenant-scoped in blob storage (no cross-tenant access)
- Export dialog uses glossary terms from #27 (e.g., "finalized review" not "committed run")
```

### P28-6: Tests — Unit + Integration + Security

```
Add comprehensive tests for the export pipeline.

UNIT TESTS (in appropriate test project):
1. DOCX builder: seed a finalized review with all section data → generate → assert all 9 section headings present in DOCX XML
2. DOCX builder: empty review (no findings, no decisions) → generates without error, shows "No items recorded" placeholders
3. PDF builder: same assertions as DOCX (section count, heading text)
4. Whitelabel: firm name + logo → renders on cover page (DOCX XML assertion)
5. Whitelabel: null/empty → uses default ArchLucid branding
6. Validator: rejects non-image MIME types for logo
7. Validator: rejects logo > 2MB

INTEGRATION TESTS:
1. Seeded finalized review → export DOCX → assert file is valid DOCX, sections non-empty where data exists
2. Seeded finalized review → export PDF → assert file is valid PDF, non-zero byte count
3. Whitelabel fields render on cover for BOTH DOCX and PDF
4. Cross-tenant negative: tenant A sets logo → export for tenant B → tenant A logo NEVER appears

GOLDEN FILE TEST:
1. Generate DOCX from stable seed data → compare section structure (heading names + order) against golden file
2. If structure changes, test fails until golden file is explicitly updated

Target 100% code coverage on the builder classes and validators.
```

### P28-7: Sample Artifact + Documentation

```
Finalize the export feature with sample output and documentation.

1. Generate a sanitized sample report from demo/seed data:
   - Use fictitious company names (e.g., "Contoso Architecture Partners" / "Northwind Corp")
   - Include fictitious logo (simple colored rectangle or generic placeholder — no real branding)
   - Place output in `docs/go-to-market/samples/architecture-review-report-sample.docx` (and .pdf)
   - This will be linked from the landing page for prospect download

2. Document in `docs/library/` or `docs/go-to-market/`:
   - How to trigger export (UI path + API call example)
   - Whitelabel configuration guide for consultants
   - Section descriptions (what data populates each)
   - Logo requirements (format, size)

3. Update `docs/library/ARCHITECTURE_COMPONENTS.md` with the new export profile entry.

ACCEPTANCE CRITERIA verification:
- [ ] Both DOCX and PDF pass tests with whitelabel path exercised
- [ ] Sample artifact exists in repo for marketing to link
- [ ] Security review checklist for logo handling documented
- [ ] Export uses glossary terms from #27
```

---

## Task #29 — Two Seeded Default Policy Packs

### Dependencies
- None for pack authoring; #28 depends on this for "Policy findings" export section content
- #31 depends on this for demo workspace policy findings

### P29-1: Explore Policy Pack Platform

```
Explore the existing policy pack infrastructure to understand persistence, CRUD, and UI patterns before authoring content.

1. Read `ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql` — find tables related to PolicyPack, PolicyRule, PolicyPackVersion, or similar (search for "policy" or "pack").
2. Read `ArchLucid.Persistence/Scripts/ArchLucid.sql` — same search.
3. Find and read the `IPolicyPacksAppService` interface and its implementation.
4. Find and read any existing PolicyPack repository classes.
5. Check `ArchLucid.Host.Composition/` for how PolicyPacks services are registered.
6. In `archlucid-ui/`, find the policy pack admin/management pages (search for routes containing "policy" or "governance").
7. Check existing migrations or seed scripts for how data is bootstrapped into tenants.
8. Read `050_PolicyPackChangeLog.sql` or similar if it exists.

Report:
- Table schema for packs and rules (columns, relationships)
- How packs are associated with tenants (shared? copied? referenced?)
- How rules are structured (id, severity, remediation, evidence hints?)
- The bootstrap/seeding mechanism for new tenants
- UI routes for viewing/managing packs
- Any existing pack content (even placeholder/empty)
```

### P29-2: Pack A Content — AI Governance / Responsible AI

```
Author the content for Pack A: AI Governance / Responsible AI.

Create a data file (JSON, SQL seed script, or C# seed class — match the pattern discovered in P29-1) containing:

PACK METADATA:
- Name: "AI Governance / Responsible AI"
- Description: "Starter baseline for AI/ML asset governance — model inventory, data handling, human oversight, and risk classification. Maps to NIST AI RMF v1.0 themes and EU AI Act high-risk categories. Not a compliance certification."
- Version: "1.0.0"
- Category: "AI Governance"
- IsDefault: true (auto-provisioned for new tenants)

RULES (target 15–25 — use stable machine IDs like `ai-gov-001` through `ai-gov-025`):

Theme clusters (distribute rules across these):
1. Model/Asset Inventory & Ownership (~4 rules)
   - AI model registry exists, model owners assigned, model versioning tracked, deployment environments documented
2. Data Minimization / Sensitive-Data Routing (~3 rules)  
   - PII/PHI excluded from training unless justified, data classification before inference, sensitive data routing documented
3. Human Review Gates (~4 rules)
   - Production promotion requires human sign-off, high-risk decisions require human review, override/escalation path documented, review cadence defined
4. Evaluation & Drift Review (~3 rules)
   - Model evaluation cadence defined, drift monitoring in place, retraining triggers documented
5. Prompt/Tool Logging & Retention (~3 rules)
   - LLM interactions logged, retention policy defined, audit trail for tool invocations
6. Vendor/Model Risk Classification (~3-4 rules)
   - Third-party model risk assessed, vendor dependency documented, fallback strategy exists, SLA/uptime requirements documented

Each rule must have:
- `id`: stable machine identifier (e.g., `ai-gov-001`)
- `title`: short human-readable name
- `description`: one-paragraph explanation
- `severity`: Info | Low | Medium | High | Critical
- `remediationGuidance`: actionable remediation text
- `evidenceHints`: list of extractor/manifest fields that could satisfy this rule (where applicable)
- `frameworkMappings`: array of `{ framework: "NIST AI RMF v1.0", theme: "..." }` and `{ framework: "EU AI Act", category: "..." }`

CONSTRAINTS:
- Do NOT claim compliance certification — use "maps to themes" language
- Severity distribution: mostly Medium, some High, a few Low/Info — no Critical at MVP
- Evidence hints should reference actual extractor/manifest field names from the codebase where possible
```

### P29-3: Pack B Content — Security Architecture Baseline

```
Author the content for Pack B: Security Architecture Baseline.

Create a data file (same format as Pack A from P29-2) containing:

PACK METADATA:
- Name: "Security Architecture Baseline"
- Description: "Starter security posture checks for cloud architecture reviews — identity, network, encryption, logging, and secure SDLC. Aligned to CIS Azure Foundations and OWASP ASVS themes. Not an exhaustive compliance assessment."
- Version: "1.0.0"
- Category: "Security"
- IsDefault: true (auto-provisioned for new tenants)

RULES (target 20–30 — use stable machine IDs like `sec-base-001` through `sec-base-030`):

Theme clusters:
1. Identity & Access Management (~5 rules)
   - MFA enforced for privileged access, service accounts use managed identity, secrets not in source code, RBAC least-privilege applied, conditional access policies documented
2. Network Segmentation & Private Endpoints (~5 rules)
   - No public endpoints for data stores, private endpoints for PaaS services, NSG/firewall rules documented, east-west traffic segmented, DNS resolution private
3. Encryption (~4 rules)
   - Data encrypted at rest (platform keys minimum), TLS 1.2+ enforced, key rotation policy exists, certificate management automated
4. Logging & Monitoring (~5 rules)
   - Centralized logging enabled, security events forwarded to SIEM, alert rules for auth failures, resource change audit, log retention ≥ 90 days
5. Secure SDLC Hooks (~5-6 rules)
   - Branch protection on main, code review required, dependency scanning enabled, container image scanning, IaC scanning in CI, secrets scanning pre-commit

Each rule has the same structure as Pack A: id, title, description, severity, remediationGuidance, evidenceHints, frameworkMappings.

Framework mappings use:
- `{ framework: "CIS Azure Foundations", control: "..." }`
- `{ framework: "OWASP ASVS", requirement: "..." }`

CONSTRAINTS:
- Same honesty bar as Pack A — "aligned to themes" not "certified against"
- Severity distribution: mix of Medium and High, some Critical for identity/secrets, some Low for documentation items
- Keep evidence hints tied to Azure extractor fields where the ArchLucid extractor would surface relevant data
```

### P29-4: Seeding Mechanism + Persistence

```
Implement the seeding/bootstrap mechanism that provisions both default packs for every new tenant.

Based on the infrastructure discovered in P29-1:

1. If DbUp migration is the pattern: create a new migration script that inserts Pack A and Pack B with all rules into the appropriate tables. Ensure it is idempotent (does not duplicate if re-run).

2. If a C# bootstrap/seed service is the pattern: create `DefaultPolicyPackSeeder` (or match existing naming) that:
   - Checks if default packs already exist for the tenant
   - If not, inserts Pack A and Pack B with full rule sets
   - Wired into tenant creation flow (or startup bootstrap)

3. Ensure pack versioning: each pack has a version identifier and a changelog entry per `050_PolicyPackChangeLog.sql` patterns. Future updates to pack content should increment version without silently mutating tenant expectations.

4. Verify RLS/scoping: default packs should be readable by all tenants but not editable by tenants (system-owned). Confirm this matches existing access patterns.

TESTS:
- Integration test: create a new tenant → verify both packs exist with expected rule counts (≥15 for Pack A, ≥20 for Pack B)
- Idempotency test: run seeder twice → no duplicate packs
- RLS test: tenant A cannot modify system-owned packs

CONSTRAINTS:
- Match existing persistence patterns exactly (Dapper, repository classes, etc.)
- If packs are global (not per-tenant copies), ensure read-path respects whatever isolation exists
- Do not introduce EF Core or other ORM
```

### P29-5: UI Visibility + Documentation

```
Ensure the seeded packs are visible and usable in the operator UI, and create documentation.

UI VERIFICATION:
1. Confirm packs appear in `archlucid-ui` policy-pack administrator flows (likely under governance/policy routes found in P29-1)
2. If packs need an "enabled/active" toggle per tenant, ensure defaults are active
3. Verify rule detail view shows: title, description, severity, remediation guidance, framework mappings
4. If policy evaluation runs against evidence, verify that running a review with evidence produces findings from these packs

DOCUMENTATION:
1. Create `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`:
   - Lists exactly TWO bundled categories at GA: AI Governance, Security Baseline
   - States rule counts (Pack A: N rules, Pack B: M rules)
   - Explicitly states: "Azure landing-zone / CAF-aligned pack → V1.1"
   - Includes framework mapping disclaimers

2. Create `docs/library/` appendix for each pack:
   - Pack A: NIST AI RMF v1.0 theme mappings table + EU AI Act category mappings table
   - Pack B: CIS Azure Foundations control mappings table + OWASP ASVS requirement mappings table
   - Each includes disclaimer: "Starter baseline; buyer responsibility for jurisdictional compliance"

3. Update `docs/library/V1_DEFERRED.md` (or equivalent) with explicit note: "Azure landing-zone / CAF-aligned curated pack — V1.1 content slice"

ACCEPTANCE CRITERIA:
- Pilot tenant sees non-empty AI governance + security baseline findings when running against demo evidence
- Marketing doc lists exactly two bundled categories with landing-zone explicitly V1.1
- No regression to RBAC / RLS boundaries on pack read paths
```

---

## Task #30 — Bulk Evidence Upload (≤30) API + UI + Audit

### Dependencies
- #27 (glossary — UI copy must say "Evidence" / "Capture" per glossary)

### P30-1: Explore Existing Evidence Upload

```
Explore the existing single-file evidence upload infrastructure to understand what to extend.

1. Search for evidence upload handlers in `ArchLucid.Api/` (controllers accepting file uploads, multipart form data)
2. Search for evidence storage in `ArchLucid.Application/` (services that persist evidence artifacts)
3. Check the evidence model in `ArchLucid.Contracts` or `ArchLucid.Core` — what does an evidence item look like?
4. In `archlucid-ui/`, find the capture/evidence upload UI (file input, drag-drop components)
5. Check `appsettings.json` (or `appsettings.Development.json`) for existing upload limits or configuration patterns
6. Check `AUDIT_COVERAGE_MATRIX.md` for existing evidence-related audit events
7. Understand the blob storage pattern: where do evidence files go? Container per tenant? Per review?

Report:
- The existing upload endpoint (route, method, accepted types)
- How evidence items relate to a review (foreign keys, association model)
- Current single-file upload size limits (if any)
- Blob storage container/path pattern
- Existing audit events for evidence operations
- The UI component used for upload
```

### P30-2: Configuration + Validation Layer

```
Add the configurable cap and validation for bulk upload.

1. In `appsettings.json` (and `appsettings.Development.json`):
   - Add `ArchLucid:EvidenceBulkUploadMaxFiles` with default value `30`
   - Add to the appropriate configuration binding class (Options pattern or whatever the repo uses)

2. Create `BulkEvidenceUploadValidator` (or match naming conventions):
   - Accepts file count, validates against configured max
   - Returns structured validation result (success or failure with machine-readable error code)
   - Method: `ValidateBulkUpload(int fileCount, int maxAllowed)` → returns validation result

3. Define the error response for exceeding the cap:
   - HTTP status: 400 (Bad Request) with problem+json body
   - Match existing validation error patterns in the API (check how other 400s are structured)
   - Error code: `EVIDENCE_BULK_UPLOAD_LIMIT_EXCEEDED`
   - Include `maxAllowed` and `attempted` in the problem details

TESTS:
- Unit test: 30 files → passes validation
- Unit test: 31 files → fails with correct error code
- Unit test: 0 files → fails (at least 1 required)
- Configuration binding test: setting reads from config correctly
```

### P30-3: API Endpoint — Bulk Upload

```
Implement the HTTP endpoint for bulk evidence upload.

Add a new endpoint (or extend existing) that accepts multiple files:

ENDPOINT:
- Route: match existing evidence upload patterns, e.g., `POST /v1/reviews/{reviewId}/evidence/bulk` or similar
- Accept: `multipart/form-data` with multiple file parts
- Validate: file count ≤ configured max (30 default), review exists, user has permission
- On success: return 200/201 with list of created evidence item IDs
- On failure (count exceeded): return 400 with problem+json per P30-2
- On failure (review not found): return 404
- On failure (permission): return 403

IMPLEMENTATION:
1. Parse all files from multipart request
2. Validate count against cap BEFORE processing any files (fail fast)
3. For each file: reuse existing single-file evidence persistence logic (storage, metadata creation)
4. Wrap in transaction or ensure partial failure handling is documented (all-or-nothing preferred)
5. Emit audit event(s) — see P30-5

CONSTRAINTS:
- Reuse existing evidence storage service — do NOT duplicate blob upload logic
- Reuse existing per-file validation (MIME types, size limits) — apply to each file in the batch
- Keep the endpoint additive — do not break existing single-file upload
- Match existing controller patterns (dependency injection, cancellation tokens, null checks)
```

### P30-4: UI — Bulk Upload Component

```
Implement the bulk upload UI in `archlucid-ui/`.

1. Locate the existing capture/evidence upload component (from P30-1 findings)

2. Extend or replace with a multi-file capable component:
   - Drag-and-drop zone accepting multiple files
   - File browser with multi-select enabled
   - Show file list with individual remove buttons before upload
   - Display quota indicator: "n / 30 files" (read max from API config or hardcode with TODO for dynamic)
   - If user selects > 30 files: immediately show friendly error (client-side validation before server round-trip)
   - Progress indicator during upload (individual or aggregate)
   - Success/failure feedback per file (or aggregate)

3. Use glossary terms per improvement #27:
   - Section heading: "Add evidence" or "Capture evidence" (NOT "Upload artifacts")
   - Cap disclosure text: "Upload up to 30 files per action"
   - Error message: "Maximum 30 files per upload. Please remove {n} files or upload in multiple batches."

4. Accessibility:
   - Drag zone has `aria-label` for screen readers
   - File count and quota announced on change
   - Error messages linked to input via `aria-describedby`

TESTS (Vitest):
- Renders quota indicator ("0 / 30")
- Selecting 5 files shows "5 / 30"
- Selecting 31 files shows error, disables upload button
- Removing a file updates count
```

### P30-5: Audit Events + Documentation

```
Ensure bulk upload emits proper audit events and add documentation.

AUDIT:
1. Check `AUDIT_COVERAGE_MATRIX.md` for existing evidence audit events (e.g., `EvidenceAttached`, `EvidenceUploaded`)
2. For bulk upload, emit ONE audit event per file (matching single-file parity) OR one aggregate event with file list — match whatever pattern the matrix specifies
3. If the matrix has no bulk entry, add `EvidenceBulkAttached` or extend existing event to include batch context (batch ID, file count)
4. Each event must include: tenant ID, review ID, user ID, file names, timestamp, correlation ID

DOCUMENTATION:
1. Add to `docs/go-to-market/` or `docs/library/`:
   - One-liner: "Bulk upload up to 30 files per action at GA."
   - Note: "Larger batches (ZIP expansion, folder recursion) deferred to V1.1"

2. Update `docs/library/V1_DEFERRED.md` (or equivalent):
   - "Raising bulk upload cap beyond 30 files — V1.1"
   - "ZIP archive expansion for evidence upload — V1.1"
   - "Folder recursion for evidence upload — V1.1"

3. Update API documentation / OpenAPI spec if the repo maintains one manually

INTEGRATION TEST:
- Upload 30 files → verify 30 audit events (or 1 aggregate) emitted with correct data
- Upload 31 files → verify NO audit events emitted (rejected before processing)

ACCEPTANCE CRITERIA:
- Pilot can attach ≤30 artifacts in one action without shell scripting
- Marketing disclosure text ships beside bulk control
- Audit events match single-file parity per AUDIT_COVERAGE_MATRIX.md
```

---

## Task #31 — Two Demo Workspaces + Release Smoke

### Dependencies
- #27 (glossary — workspace content uses new terms)
- #28 (export — Workspace B demonstrates report export)
- #29 (policy packs — Workspace B surfaces policy findings)

### P31-1: Explore Existing Demo/Bootstrap Infrastructure

```
Explore existing demo, marketing, or bootstrap conventions to understand how to implement seeded workspaces.

1. Search for existing demo/showcase code:
   - Read `archlucid-ui/src/lib/showcase-static-demo.ts` — what does this do currently?
   - Search for "demo" or "showcase" or "seed" in `ArchLucid.Host.Core` startup/bootstrap
   - Check if there's an existing tenant bootstrap that seeds sample data

2. Check onboarding routes in `archlucid-ui/`:
   - Search for onboarding/welcome/getting-started routes
   - How does a new user first land in the product?

3. Understand the data model for a "workspace":
   - Is a workspace a tenant? A project within a tenant? A named collection of reviews?
   - What entities need to be seeded: reviews, evidence items, manifests, decisions, findings?

4. Check `release-smoke.ps1` and `release-smoke.cmd`:
   - What do they currently test?
   - How are Playwright tests structured in this repo?
   - Where do e2e tests live?

5. Check for environment/config flags that distinguish demo from production content

Report:
- The data model hierarchy (tenant → workspace/project → review → evidence/findings)
- The seeding mechanism options (migration, startup service, script)
- Current Playwright test location and patterns
- Current release-smoke test scope
- How to mark content as "demo" without billing impact
```

### P31-2: Workspace A — Self-Demo / Product Tour Seed Data

```
Create the seed data for Workspace A: Self-Demo / Product Tour.

PURPOSE: Evaluators land here from the secondary CTA ("Try the self-demo"). It walks them through the canonical workflow: Capture → Evidence → Review → Resolve findings → Record decisions → Generate report.

SEED DATA (use fabricated company names — NO real customer data):
- Company: "Northwind Architects" (consulting firm) reviewing "Contoso Cloud Platform"
- Project/workspace name: "Product Tour — Architecture Review"

Create seed content for each workflow stage:
1. CAPTURE: system context captured (fabricated Azure subscription with common PaaS services)
2. EVIDENCE: 5-8 evidence artifacts attached (architecture diagrams as placeholder PDFs, decision records, security questionnaire responses — all synthetic)
3. REVIEW: one completed review (architecture run) with:
   - 3-5 findings from security baseline pack (#29 Pack B)
   - 2-3 findings from AI governance pack (#29 Pack A) 
   - Mix of severities (1 High, 3 Medium, 2 Low)
4. DECISIONS: 2-3 decisions recorded (accept risk, remediate, defer)
5. FINALIZED: review is committed/finalized (golden manifest exists)
6. REPORT: demonstrates that export is available (actual generation happens on-demand)

IMPLEMENTATION:
- Create as idempotent seed script/migration (same mechanism as P29-4)
- Add `IsDemoWorkspace = true` metadata flag (or equivalent) to prevent billing confusion
- Ensure the workspace is read-only for evaluators (they can view and export but not modify seed data)
- Document the stable entry URL for this workspace

OUTPUT: seed data file/script + documented URL pattern in `docs/go-to-market/DEMO_WORKSPACES.md`
```

### P31-3: Workspace B — Synthetic Regulated Scenario Seed Data

```
Create the seed data for Workspace B: Synthetic Regulated Scenario.

PURPOSE: Demonstrates AI-era governance narrative with policy findings. Shows how ArchLucid handles a regulated workload review including whitelabel export.

SEED DATA (fabricated — NO real PHI/PII/regulated data):
- Company: "Alpine Health Innovations" (fictional healthtech)
- Consulting firm: "Meridian Advisory Group" (whitelabel consultant)
- Project/workspace name: "AI Governance Review — Patient Risk Scoring Platform"

Create seed content demonstrating regulated governance:
1. CAPTURE: system with AI/ML components (model serving endpoints, training pipeline references, data lake with classification tags)
2. EVIDENCE: 6-10 evidence artifacts:
   - Model registry export (synthetic)
   - Data classification matrix (synthetic)
   - Human review process document (synthetic)
   - Deployment approval workflow screenshot (synthetic)
   - Vendor risk assessment for third-party model (synthetic)
   - Monitoring/drift detection config (synthetic)
3. REVIEW: completed review with:
   - 5-7 findings from AI governance pack (#29 Pack A) — e.g., model versioning gaps, missing drift monitoring, incomplete human review gates
   - 3-4 findings from security baseline pack (#29 Pack B) — e.g., public endpoint for model API, missing encryption at rest for training data
   - Higher severity mix (2 High, 4 Medium, 3 Low)
4. DECISIONS: 4-5 decisions with varied dispositions
5. FINALIZED: review committed
6. WHITELABEL configured: "Meridian Advisory Group" as firm, "Alpine Health — AI Governance Engagement" as title, placeholder logo

IMPLEMENTATION:
- Same seeding mechanism as Workspace A
- Demonstrates export with whitelabel fields pre-filled (evaluator can trigger export to see branded output)
- Read-only for evaluators

OUTPUT: seed data + URL pattern documented alongside Workspace A in `docs/go-to-market/DEMO_WORKSPACES.md`
```

### P31-4: Playwright Smoke Tests — Release Gate

```
Implement Playwright end-to-end smoke tests for both demo workspaces. These are RELEASE-BLOCKING — GA cannot ship if they fail.

WORKSPACE A SMOKE TEST:
1. Navigate to Workspace A entry URL
2. Assert workspace loads without error
3. Assert canonical workflow stages visible in navigation/progress indicator
4. Navigate to evidence section → assert evidence items listed (count ≥ 5)
5. Navigate to review → assert findings present with severity badges
6. Assert decisions section shows recorded decisions
7. Assert "Finalized" status indicator present
8. Assert export button/action is available (do NOT actually generate — just verify affordance)

WORKSPACE B SMOKE TEST:
1. Navigate to Workspace B entry URL
2. Assert workspace loads without error
3. Assert AI governance findings present (from Pack A)
4. Assert security baseline findings present (from Pack B)
5. Assert higher severity findings visible
6. Trigger export action → verify download initiates (check response headers for DOCX/PDF content-type; optionally verify file size > minimum threshold)
7. Assert whitelabel fields visible in export dialog (firm name pre-filled)

TEST LOCATION:
- Place in the existing Playwright test directory (discovered in P31-1)
- Name: `demo-workspace-a.smoke.spec.ts` and `demo-workspace-b.smoke.spec.ts`
- Tag with `@release-gate` or equivalent for selective CI runs

WIRE INTO RELEASE SMOKE:
- Update `release-smoke.ps1` to include these tests in the release gate
- Ensure CI pipeline runs these tests on candidate builds
- Document in `docs/engineering/BUILD.md` that GA release is blocked if these fail
```

### P31-5: Documentation + Fixture Maintenance Strategy

```
Finalize demo workspace documentation and establish maintenance strategy.

DOCUMENTATION (`docs/go-to-market/DEMO_WORKSPACES.md` — create or complete):
1. Stable URLs for each workspace (pattern + actual staging/production URLs)
2. Tenant bootstrap instructions for Sales + Marketing
3. What each workspace demonstrates (one paragraph each)
4. How to reset/reseed workspaces (for staging refreshes)
5. Cross-links: Workspace A linked from landing CTA (#32), both linked from onboarding

FIXTURE MAINTENANCE STRATEGY:
1. Document that demo workspaces are LIVING FIXTURES — feature changes can break them
2. Establish rule: any PR that changes evidence model, finding display, export format, or policy evaluation MUST verify demo smoke tests still pass
3. Add note to PR template or CI: "Does this change affect demo workspace content? Run @release-gate tests."
4. If seed data format changes, the seed scripts must be updated in the same PR

ACCEPTANCE CRITERIA VERIFICATION:
- [ ] Release manager cannot tag GA unless both workspace smokes pass
- [ ] Neither workspace references real customer identifiers (grep for PII patterns)
- [ ] Breaking changes caught by failing smoke force fixture updates
- [ ] `docs/go-to-market/DEMO_WORKSPACES.md` has stable URLs and bootstrap instructions
```

---

## Task #32 — Landing CTA Stack + Analytics

### Dependencies
- #31 (Workspace A URL must be stable before wiring secondary CTA)

### P32-1: Explore Landing Page Infrastructure

```
Explore the current landing/marketing page implementation to understand where CTAs live.

1. Search for marketing/landing routes in `archlucid-ui/`:
   - Look for public (non-authenticated) pages: landing, home, marketing, pricing routes
   - Check for a separate marketing site directory or if it's part of the main Next.js app

2. Check for existing CTAs or hero sections:
   - Search for "waitlist", "early access", "get started", "sign up", "request demo" in UI source
   - Find the current hero/above-fold component

3. Understand the analytics setup:
   - What analytics library is used? (PostHog, Mixpanel, GA4, custom)
   - Where are analytics events typically fired? (hook, utility function, direct calls)
   - Is there a UTM preservation pattern?

4. Check for CRM/lead capture integration:
   - Is there a form submission handler? Email capture endpoint?
   - Does the system integrate with HubSpot, Mailchimp, or similar?
   - Check for `FirstTenantFunnelEvents` references

5. Look for existing calendar/booking integrations (Calendly, Cal.com, etc.)

Report:
- Landing page file location(s) and framework (static, SSR, marketing CMS)
- Current CTA state (what exists today)
- Analytics library and event firing pattern
- CRM/lead capture mechanism
- Calendar booking approach (if any)
```

### P32-2: Primary CTA — Request Walkthrough

```
Implement the primary CTA: "Request walkthrough" button.

DESIGN:
- Visually prominent: large button, primary brand color, above the fold
- Position: hero section, most prominent CTA in the hierarchy
- Label: "Request walkthrough" (exact copy — owner-approved)

BEHAVIOR:
- Click → opens calendar booking URL (config-driven, e.g., environment variable `NEXT_PUBLIC_WALKTHROUGH_BOOKING_URL`)
- Fallback (if no booking URL configured): mailto link with pre-filled subject: "ArchLucid Architecture Review — Walkthrough Request"
- Preserve UTM parameters from current URL → append to booking URL

ANALYTICS:
- Fire event: `cta_walkthrough_click`
- Include properties: `{ source: 'hero', utm_source, utm_medium, utm_campaign }` (from URL params if present)

CONFIGURATION:
- Add `NEXT_PUBLIC_WALKTHROUGH_BOOKING_URL` to `.env.example` and environment documentation
- Add `NEXT_PUBLIC_WALKTHROUGH_MAILTO_FALLBACK` for the mailto alternative

IMPLEMENTATION:
- Create reusable `CtaButton` component (will be used by all three CTAs with different variants)
- Primary variant: filled, large, high contrast
```

### P32-3: Secondary CTA — Try the Self-Demo

```
Implement the secondary CTA: "Try the self-demo" linking to Workspace A.

DESIGN:
- Secondary visual hierarchy: outlined button or less prominent filled button
- Position: below or beside primary CTA in hero section
- Label: "Try the self-demo" (exact copy)

BEHAVIOR:
- Click → deep-link to Workspace A entry URL from improvement #31
- URL pattern: config-driven (`NEXT_PUBLIC_SELF_DEMO_URL`) pointing to the demo workspace route
- Opens in same tab (evaluator stays in product)

TOOLTIP / DISCLOSURE:
- On hover or via adjacent microcopy: "Explore a synthetic architecture review — no sign-up required. Demo uses fabricated data only."
- Must NOT imply full product access parity with paid tenancy

ANALYTICS:
- Fire event: `cta_self_demo_click`
- Include properties: `{ source: 'hero', utm_source, utm_medium, utm_campaign }`

CONFIGURATION:
- Add `NEXT_PUBLIC_SELF_DEMO_URL` to `.env.example` (coordinate with #31 Workspace A URL)
```

### P32-4: Tertiary CTA — Early Access / Waitlist

```
Implement the tertiary CTA: "Early access" email capture.

DESIGN:
- Tertiary visual hierarchy: text link or ghost/minimal button
- Position: below the primary + secondary CTAs
- Label: "Join early access" or "Early access" (owner-approved copy)

BEHAVIOR:
- Click → reveals inline email capture form (or modal — match existing patterns)
- Form fields: email (required), company name (optional), role (optional dropdown)
- Submit → POST to lead capture endpoint (CRM integration or internal API)
- Post-submit copy: "Thanks! Our team will follow up within 2 business days." (set expectation — NOT instant access)

MUST NOT:
- Imply instant product login after submission
- Show a live Checkout/payment path
- Promise access parity with walkthrough-led pilots

ANALYTICS:
- Fire event: `cta_early_access_submit` (on successful form submission, not on click)
- Include properties: `{ source: 'hero', email_domain (hashed or domain-only for analytics), utm_source, utm_medium, utm_campaign }`

IMPLEMENTATION:
- If `FirstTenantFunnelEvents` or similar CRM handoff exists, wire the submission to it
- If no CRM exists: create a simple API endpoint that stores leads (tenant-scoped or dedicated leads table) with timestamp
- Add rate limiting on submission endpoint (prevent spam — match existing API rate limit patterns)
```

### P32-5: Visual Hierarchy + Responsive Layout

```
Ensure the three CTAs render in proper visual hierarchy and are responsive.

LAYOUT (hero section):
- Desktop: Primary CTA prominently centered or left-aligned, Secondary beside it, Tertiary below as text link
- Tablet: Stack Primary + Secondary side by side, Tertiary below
- Mobile: Stack all three vertically in order: Primary → Secondary → Tertiary

VISUAL HIERARCHY:
- Primary ("Request walkthrough"): filled button, brand primary color, largest size, bold text
- Secondary ("Try the self-demo"): outlined button or secondary color fill, same height as primary, regular weight
- Tertiary ("Join early access"): text link style or ghost button, smaller font, below the button row

ADDITIONAL COPY (around CTAs):
- Subheading above CTAs: aligned to marketing positioning (e.g., "See how ArchLucid delivers architecture reviews your ARB trusts")
- Below tertiary: cross-link to FAQ mentioning bulk upload ≤30 files (#30) and demo workspaces (#31)

DARK MODE / THEMING:
- If the landing page supports dark mode, ensure all three CTAs maintain contrast ratios (WCAG AA minimum)
- Test both themes

TESTS (Vitest or component tests):
- All three CTAs render in correct order
- Primary has correct href/onClick
- Secondary links to self-demo URL
- Tertiary form submission works (mock API)
- Responsive breakpoints render correct layout (snapshot or visual regression if configured)
```

### P32-6: Analytics Verification + Legal/Copy Review

```
Verify analytics integration and ensure copy/legal compliance.

ANALYTICS VERIFICATION:
1. In staging/development, verify events fire correctly:
   - `cta_walkthrough_click` — fires on primary CTA click
   - `cta_self_demo_click` — fires on secondary CTA click
   - `cta_early_access_submit` — fires on form submission (NOT on click)
2. Verify UTM parameter preservation on all events
3. Add a smoke test or integration test that asserts events fire (mock analytics library, verify calls)

COPY / LEGAL REVIEW CHECKLIST:
1. "Early access" language matches walkthrough-led onboarding (no bait-and-switch)
2. No hero $ pricing for 90-day window — pricing remains sales-qualification path only
3. Self-demo tooltip honestly discloses synthetic/fabricated data
4. Cross-link FAQ references: bulk upload ≤30 files, demo workspaces available
5. Footer attribution correct (if required by marketing standards)

OUT OF SCOPE VERIFICATION:
- Confirm NO public paid-pilot price band on hero
- Confirm NO "Buy now" or self-serve checkout button
- Confirm NO Stripe Checkout path accessible from landing (deferred per #7 / P4)

DOCUMENTATION:
1. Update `docs/go-to-market/` with CTA implementation details
2. Document config variables in deployment guide
3. Cross-reference demo workspace URLs from #31

TESTS (Playwright — optional but recommended):
- Landing page loads → three CTAs visible
- Click "Try the self-demo" → navigates to Workspace A (coordinate with #31 smoke)
- Submit early access form → confirmation message appears
```

---

## Cross-Task Execution Order

```
Recommended sequencing (respects dependencies):

Phase 1 (parallel-safe):
  #27 P27-1 through P27-6  (glossary — no deps)
  #29 P29-1 through P29-3  (pack content authoring — no deps)
  #30 P30-1               (exploration — no deps)

Phase 2 (after Phase 1):
  #29 P29-4, P29-5         (seeding — needs pack content)
  #30 P30-2 through P30-5  (bulk upload — uses #27 glossary)
  #28 P28-1               (exploration — needs #27 glossary terms known)

Phase 3 (after Phase 2):
  #28 P28-2 through P28-7  (export — uses #27 terms, #29 findings data)

Phase 4 (after Phase 3):
  #31 P31-1 through P31-5  (demo workspaces — uses #28 export, #29 packs)

Phase 5 (after Phase 4):
  #32 P32-1 through P32-6  (landing CTAs — uses #31 Workspace A URL)
```
